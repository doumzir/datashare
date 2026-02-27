# MAINTENANCE — DataShare

## Opérations courantes

### Démarrer le projet en développement

```bash
# Terminal 1 — API NestJS
cd api
npm run start:dev

# Terminal 2 — Frontend Vite
cd web
npm run dev
```

- API : http://localhost:3000
- Frontend : http://localhost:5173

### Variables d'environnement requises

```bash
# api/.env
DATABASE_URL="postgresql://postgres@localhost:5432/datashare"
JWT_SECRET="votre-secret-jwt-long-et-aleatoire"
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=1073741824
PORT=3000
```

---

## Base de données

### Migrations Prisma

```bash
cd api

# Créer et appliquer une migration
npx prisma migrate dev --name nom_de_la_migration

# Appliquer en production
npx prisma migrate deploy

# Réinitialiser (développement uniquement)
npx prisma migrate reset

# Voir l'état des migrations
npx prisma migrate status
```

### Seed (données de test)

```bash
cd api
npx prisma db seed
```

### Ouvrir Prisma Studio (interface visuelle)

```bash
cd api
npx prisma studio
```

---

## Fichiers uploadés

Les fichiers sont stockés dans `api/uploads/` (gitignored).

```bash
# Voir les fichiers stockés
ls api/uploads/

# Taille du dossier uploads
du -sh api/uploads/
```

### Nettoyage manuel des fichiers expirés

Le cron tourne automatiquement à minuit (`0 0 * * *`). Pour forcer manuellement :

```bash
# Via la base de données
psql -U postgres datashare -c "SELECT id, originalName, expiresAt FROM \"File\" WHERE \"expiresAt\" < NOW();"
```

---

## Tâches de maintenance périodiques

| Fréquence | Tâche |
|---|---|
| Automatique (minuit) | Purge des fichiers expirés (SchedulerService) |
| Hebdomadaire | `npm audit` — vérifier les vulnérabilités |
| Mensuel | `npm update` — mettre à jour les dépendances mineures |
| Trimestriel | Revue des dépendances majeures (voir ci-dessous) |
| À chaque déploiement | `npx prisma migrate deploy` |

---

## Mise à jour des dépendances

### Procédure générale

```bash
# 1. Vérifier les mises à jour disponibles
cd api && npx npm-check-updates
cd web && npx npm-check-updates

# 2. Mettre à jour les versions mineures/patch (sans risque)
cd api && npm update
cd web && npm update

# 3. Pour les versions majeures — faire une branche dédiée
git checkout -b chore/update-deps-<date>
# Mettre à jour, tester, PR
```

### Fréquence recommandée

| Type de mise à jour | Fréquence | Risque |
|---|---|---|
| **Patch** (ex: 1.2.3 → 1.2.4) | Automatique / hebdomadaire | Faible — correctifs de bugs |
| **Minor** (ex: 1.2.x → 1.3.0) | Mensuel | Faible — rétrocompatible |
| **Major** (ex: 1.x → 2.0) | Trimestriel / à la demande | Élevé — breaking changes possibles |

### Dépendances à surveiller en priorité

| Package | Raison | Risque mise à jour |
|---|---|---|
| `prisma` + `@prisma/client` | Changements d'API fréquents (v7 a cassé v6) | Élevé — tester migrations |
| `@nestjs/*` | Framework principal backend | Moyen — suivre changelog |
| `react` + `react-router` | Framework principal frontend | Moyen — suivre changelog |
| `bcrypt` | Sécurité critique | Faible — stable |
| `jsonwebtoken` (via `@nestjs/jwt`) | Sécurité critique | Faible — stable |

### Risques identifiés

| Risque | Mitigation |
|---|---|
| Migration Prisma cassante (ex: v6→v7) | Tester sur branche dédiée, vérifier `prisma.config.ts` |
| Breaking change NestJS | Lire le changelog avant de mettre à jour |
| Vulnérabilité dans `devDependencies` | Acceptée si non exploitable en runtime (voir SECURITY.md) |
| `package-lock.json` divergent | Toujours committer le lockfile avec les mises à jour |

---

## Logs et monitoring

```bash
# Logs NestJS en développement
cd api && npm run start:dev
# Les logs apparaissent dans la console avec timestamps

# Logs PostgreSQL (macOS Homebrew)
tail -f /opt/homebrew/var/log/postgresql@16.log
```

---

## Structure des dossiers importants

```
api/
├── uploads/         ← fichiers uploadés (gitignored, à sauvegarder)
├── prisma/
│   ├── schema.prisma
│   ├── migrations/  ← historique des migrations DB
│   └── seed.ts
└── .env             ← variables d'environnement (gitignored)
```

---

## Commandes de diagnostic rapide

```bash
# Vérifier que l'API répond
curl http://localhost:3000

# Lister les fichiers en base
psql -U postgres datashare -c "SELECT \"originalName\", \"expiresAt\", \"downloadCount\" FROM \"File\";"

# Lister les utilisateurs
psql -U postgres datashare -c "SELECT email, \"createdAt\" FROM \"User\";"

# Tests rapides
cd api && npx jest
cd web && npx vitest run
```

---

## Déploiement (référence)

Ce projet est conçu pour le développement local. Pour un déploiement :

1. Configurer les variables d'environnement de production
2. Changer `CORS origin` dans `api/src/main.ts`
3. Utiliser `npm run build` + `npm run start:prod` pour l'API
4. Servir `web/dist/` via un CDN ou serveur statique
5. Utiliser un stockage persistant pour `uploads/` (ex: S3)
