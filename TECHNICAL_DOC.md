# Documentation Technique — DataShare

## 1. Architecture de l'application

```
┌─────────────────────────────────────────────────────────────────┐
│                         NAVIGATEUR                              │
│           React + Vite SPA  (port 5173)                         │
│   ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌─────────────┐  │
│   │  Login   │  │ Register │  │ Dashboard │  │  Download   │  │
│   └──────────┘  └──────────┘  └───────────┘  └─────────────┘  │
│              React Router v7 (client-side routing)              │
│              Tailwind CSS v4                                     │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTP REST  (Authorization: Bearer JWT)
                       │ CORS autorisé pour localhost:5173
┌──────────────────────▼──────────────────────────────────────────┐
│                  NestJS REST API  (port 3000)                   │
│   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│   │  AuthModule  │  │  FilesModule │  │  SchedulerService    │ │
│   │ POST /auth/* │  │ POST /files/*│  │  Cron 0 0 * * *      │ │
│   │ JWT Strategy │  │ GET  /files/*│  │  purge expirés       │ │
│   └──────────────┘  │ DELETE /files│  └──────────────────────┘ │
│                     └──────┬───────┘                           │
│   ┌─────────────────────┐  │  ┌──────────────────────────────┐ │
│   │    PrismaService    │  │  │      StorageService          │ │
│   │   (adapter-pg)      │  │  │  api/uploads/ (filesystem)   │ │
│   └──────────┬──────────┘  │  └──────────────────────────────┘ │
└──────────────┼─────────────┼───────────────────────────────────┘
               │ TCP         │ I/O filesystem
┌──────────────▼──────────┐  ┌──────────────────────────────────┐
│  PostgreSQL 16           │  │  api/uploads/                    │
│  Base : datashare        │  │  Fichiers stockés (nom aléatoire)│
│  Tables : User, File,Tag │  │  Gitignored                      │
└─────────────────────────┘  └──────────────────────────────────┘
```

**Flux d'upload :**
1. Frontend envoie `POST /files/upload` (FormData) avec Bearer JWT optionnel
2. multer sauvegarde le fichier sous un nom aléatoire (`crypto.randomBytes(16).toString('hex') + ext`)
3. FilesService crée l'entrée File en DB (token unique, expiration, hash mot de passe si présent)
4. API retourne `{ token, shareUrl }`
5. Frontend affiche le lien de partage `/download/:token`

**Flux de téléchargement :**
1. Visiteur arrive sur `/download/:token` (public)
2. Frontend appelle `GET /files/:token` → métadonnées
3. Si fichier protégé → formulaire mot de passe → `POST /files/:token/verify-password`
4. Bouton téléchargement → `GET /files/:token/download` → stream binaire

---

## 2. Choix technologiques

| Élément | Technologie | Alternatives | Justification |
|---|---|---|---|
| Langage | TypeScript | JavaScript, Java | Type-safety, spec impose JS/TS |
| Backend | NestJS | Express, Fastify, Spring | Imposé par la spec scolaire |
| Frontend | React + Vite | Angular, Vue | Imposé par la spec scolaire |
| Routing | React Router v7 | React Router v6, TanStack | Version la plus récente et maintenue |
| CSS | Tailwind CSS v4 | Bootstrap, Styled-components | Utility-first, rapide, préférence |
| ORM | Prisma 7 | TypeORM, Sequelize, Drizzle | Type-safe, migrations versionnées, écosystème |
| Base de données | PostgreSQL 16 | MySQL, MongoDB | Imposé par la spec scolaire |
| Authentification | JWT Bearer | Session cookies, OAuth2 | Spec impose JWT ; stateless, adapté REST API |
| Upload | multer | busboy, formidable | Module officiel NestJS |
| Token fichier | crypto.randomBytes | nanoid, uuid | Natif Node.js, pas de dépendance ESM problématique |
| Hash mots de passe | bcrypt | argon2, scrypt | Standard éprouvé, disponible NestJS |
| Cron | @nestjs/schedule | node-cron, bullmq | Module officiel NestJS |
| Tests API | Jest | Mocha, Vitest | Natif NestJS |
| Tests Frontend | Vitest | Jest, Testing Library | Natif Vite, rapide |
| Tests E2E | Playwright | Cypress, Selenium | Standard moderne, multi-navigateurs |
| Performance | k6 | JMeter, Locust | Mentionné dans la spec, scripts JS |

---

## 3. Modèle de données

### Entités

**User**
```
id          String   @id @default(cuid())
email       String   @unique
password    String   (bcrypt hash)
createdAt   DateTime @default(now())
files       File[]
```

**File**
```
id            String   @id @default(cuid())
token         String   @unique      (partage public)
originalName  String                (nom affiché)
storedName    String                (nom fichier sur disque, aléatoire)
mimeType      String
size          Int                   (octets)
path          String                (chemin absolu)
expiresAt     DateTime
createdAt     DateTime @default(now())
password      String?               (bcrypt hash, null si pas de protection)
userId        String?               (null = upload anonyme)
user          User?    @relation(...)
tags          Tag[]
downloadCount Int      @default(0)
```

**Tag**
```
id      String @id @default(cuid())
name    String
fileId  String
file    File   @relation(fields: [fileId], references: [id], onDelete: Cascade)
@@unique([name, fileId])
```

### Relations

- `User` 1 → N `File` (un utilisateur peut avoir plusieurs fichiers)
- `File` 1 → N `Tag` (un fichier peut avoir plusieurs tags)
- Suppression d'un `File` → suppression en cascade de ses `Tag`
- `userId` nullable → support upload anonyme (US07)

---

## 4. Documentation d'API

Le contrat d'interface complet est dans `/Users/demdoum/P3/docs/API_CONTRACT.md`.

### Endpoints principaux

| Méthode | Route | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Non | Inscription → retourne JWT |
| POST | `/auth/login` | Non | Connexion → retourne JWT |
| POST | `/files/upload` | Optionnelle | Upload fichier (multipart/form-data) |
| GET | `/files/my` | Requise | Liste des fichiers de l'utilisateur |
| GET | `/files/:token` | Non | Métadonnées d'un fichier |
| GET | `/files/:token/download` | Non | Téléchargement binaire |
| POST | `/files/:token/verify-password` | Non | Vérifier le mot de passe |
| DELETE | `/files/:id` | Requise (owner) | Supprimer son fichier |

### Format de réponse

```json
// POST /auth/register ou /auth/login
{ "access_token": "eyJhbGciOiJIUzI1NiJ9..." }

// GET /files/:token
{
  "id": "cuid...",
  "token": "base64url...",
  "originalName": "rapport.pdf",
  "mimeType": "application/pdf",
  "size": 204800,
  "expiresAt": "2026-03-06T00:00:00.000Z",
  "hasPassword": false,
  "tags": ["projet", "2026"],
  "downloadCount": 3
}
```

---

## 5. Sécurité et gestion des accès

### Authentification

- **JWT Bearer** : token signé avec `JWT_SECRET` (env), durée 7 jours
- **Stockage client** : `localStorage` (clé `datashare_token`)
- **Transport** : header `Authorization: Bearer <jwt>`
- **Guard NestJS** : `JwtAuthGuard` (routes protégées) + `OptionalJwtAuthGuard` (upload)

### Hachage

- **Mots de passe utilisateurs** : `bcrypt` (salt rounds = 10)
- **Mots de passe fichiers** : `bcrypt` (salt rounds = 10)

### Fichiers

- **Extensions interdites** : `.exe`, `.bat`, `.sh`, `.ps1`, `.cmd`, `.msi`
- **Noms stockés** : `crypto.randomBytes(16).toString('hex') + ext` — jamais le nom original
- **Tokens de partage** : `crypto.randomBytes(16).toString('base64url')` — 128 bits d'entropie
- **Taille max** : `MAX_FILE_SIZE` (défaut 1 Go), validé par multer

### Contrôle d'accès

- **Ownership check** : `file.userId === req.user.id` avant suppression → `ForbiddenException` si violation
- **CORS** : `origin: 'http://localhost:5173'` uniquement
- **Validation** : `class-validator` sur tous les DTOs NestJS

### Scan de sécurité

Voir [SECURITY.md](./SECURITY.md) pour les résultats détaillés de `npm audit`.

---

## 6. Qualité, tests et maintenance

Résumé — les fichiers complets sont dans le repo :

| Document | Contenu |
|---|---|
| [TESTING.md](./TESTING.md) | 21 tests Jest + 12 Vitest + 7 Playwright + k6. Couverture services backend : 91-100% |
| [SECURITY.md](./SECURITY.md) | 0 vulnérabilité runtime. 14 vulnérabilités modérées en devDependencies (CLI tools) |
| [PERF.md](./PERF.md) | Bundle front : 78 kB gzip. Backend : p(95) < 100ms sous 10 VUs |
| [MAINTENANCE.md](./MAINTENANCE.md) | Procédures BDD, logs, déploiement, mise à jour dépendances |

---

## 7. Processus d'installation et d'exécution

Voir [README.md](./README.md) pour les instructions complètes.

**Résumé :**

```bash
# Prérequis : Node.js 20+, PostgreSQL 14+
cd api && npm install
cp .env.example .env   # configurer DATABASE_URL et JWT_SECRET
npx prisma migrate deploy && npx prisma generate

cd ../web && npm install

# Lancement
cd api && npm run start:dev     # → localhost:3000
cd web && npm run dev           # → localhost:5173
```

---

## 8. Utilisation de l'IA dans le développement

### Posture adoptée

**Binômage supervisé (vibe coding)** : l'IA génère le code initial, le développeur supervise, valide la sécurité et les edge cases.

### US confiée à l'IA : US05 + US06

Tâche assignée au copilote :
> "Implémente un composant React `FileCard` qui affiche les métadonnées d'un fichier (nom, taille, date d'expiration, tags, compteur de téléchargements), un lien de partage copiable, un badge d'état (actif/expire bientôt), et un bouton de suppression avec confirmation. Crée aussi la page `Dashboard` qui liste tous ces composants, avec un filtre par tag et une navigation header."

Ces US correspondent exactement à l'exemple fourni dans step.md : *"Écris un composant React pour afficher la liste des fichiers avec un bouton de suppression"*.

### Supervision exercée

- Vérification des appels `DELETE /files/:id` avec Bearer JWT
- Contrôle du flux de confirmation deux étapes (irréversible)
- Validation de la gestion d'erreurs réseau
- Contrôle que `PrivateRoute` redirige vers `/login`
- Relecture complète avant commit

### Commits Git traçables

```
feat(ai): implement dashboard file list with delete (US05, US06)
```

### Correctifs apportés

| Type | Correction |
|---|---|
| TypeScript | Suppression variable `tagFilter` inutilisée (TS6133) |
| TypeScript | Import `type KeyboardEvent` (verbatimModuleSyntax) |
| TypeScript | Import `type Response` dans le contrôleur NestJS |

### Apports et limites

**Apports** : gain de temps significatif sur le code JSX répétitif, gestion correcte de la confirmation de suppression en deux étapes, feedback visuel Tailwind cohérent.

**Limites** : imports TypeScript incorrects détectés uniquement à la compilation, variable inutilisée non signalée avant `tsc`.
