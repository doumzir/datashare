# DataShare

Plateforme de partage de fichiers sécurisée — projet scolaire OpenClassrooms.

Upload et partage de fichiers avec lien unique, protection par mot de passe, tags et expiration automatique.

**Stack** : NestJS (API) + React + Vite (SPA) + PostgreSQL + Prisma

---

## Prérequis

- Node.js 20+
- PostgreSQL 14+ (utilisateur `postgres` accessible)
- npm 10+

---

## Installation

### 1. Cloner le repo

```bash
git clone https://github.com/doumzir/datashare.git
cd datashare
```

### 2. Configurer l'API

```bash
cd api
cp .env.example .env
```

Éditer `api/.env` :

```env
DATABASE_URL="postgresql://postgres@localhost:5432/datashare"
JWT_SECRET="votre-secret-jwt-changez-le"
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=1073741824
PORT=3000
```

### 3. Initialiser la base de données

```bash
cd api
npm install
npx prisma migrate deploy
npx prisma generate
```

Optionnel — charger des données de démo :

```bash
npx prisma db seed
# Compte démo : demo@datashare.com / password123
```

### 4. Installer le frontend

```bash
cd ../web
npm install
```

---

## Lancer l'application

**Terminal 1 — API :**

```bash
cd api
npm run start:dev
# → http://localhost:3000
```

**Terminal 2 — Frontend :**

```bash
cd web
npm run dev
# → http://localhost:5173
```

---

## Tests

### Tests unitaires backend (Jest)

```bash
cd api
npx jest
# 21 tests — 4 suites
```

### Tests unitaires frontend (Vitest)

```bash
cd web
npx vitest run
# 12 tests — 2 suites
```

### Tests E2E (Playwright)

```bash
cd web
npx playwright install chromium  # première fois uniquement
npx playwright test
# 7 tests — 3 scénarios
```

### Test de performance (k6)

```bash
brew install k6  # macOS, première fois uniquement
# API doit tourner sur localhost:3000
k6 run scripts/load-test.js
```

---

## Structure du projet

```
datashare/
├── api/                    ← NestJS REST API (port 3000)
│   ├── src/
│   │   ├── auth/           (register, login, JWT)
│   │   ├── files/          (upload, download, suppression, cron)
│   │   ├── users/          (gestion utilisateurs)
│   │   └── prisma/         (service Prisma)
│   └── prisma/
│       ├── schema.prisma   (modèles BDD)
│       └── migrations/     (historique SQL)
├── web/                    ← React + Vite SPA (port 5173)
│   ├── src/
│   │   ├── pages/          (Home, Login, Register, Dashboard, Download)
│   │   ├── components/     (FileUploadForm, FileCard, DownloadCard, TagInput)
│   │   ├── lib/api.ts      (appels HTTP vers l'API)
│   │   └── hooks/useAuth.ts
│   └── e2e/                (tests Playwright)
├── scripts/
│   └── load-test.js        (test k6)
├── TESTING.md
├── SECURITY.md
├── PERF.md
└── MAINTENANCE.md
```

---

## Fonctionnalités

| US | Description |
|---|---|
| US01 | Upload de fichiers (authentifié) |
| US02 | Téléchargement via lien unique |
| US03 | Inscription |
| US04 | Connexion |
| US05 | Dashboard — historique des fichiers |
| US06 | Suppression de fichiers |
| US07 | Upload anonyme |
| US08 | Tags sur les fichiers |
| US09 | Protection par mot de passe |
| US10 | Expiration automatique (cron minuit) |

---

## Documentation

- [TESTING.md](./TESTING.md) — plan et résultats des tests
- [SECURITY.md](./SECURITY.md) — mesures de sécurité et scan
- [PERF.md](./PERF.md) — tests de performance et budget front
- [MAINTENANCE.md](./MAINTENANCE.md) — procédures de maintenance

---

## Lien du dépôt

https://github.com/doumzir/datashare
