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
| À chaque déploiement | `npx prisma migrate deploy` |

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
