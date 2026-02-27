# SECURITY — DataShare

## Mesures de sécurité implémentées

### Authentification

| Mesure | Implémentation |
|---|---|
| Hachage des mots de passe | `bcrypt` avec salt rounds par défaut (10) |
| Tokens JWT | Signés avec `JWT_SECRET` (env), expiration 1h |
| Transport du token | `Authorization: Bearer <jwt>` header |
| Stockage côté client | `localStorage` (token uniquement) |
| Guards NestJS | `JwtAuthGuard` (requis) + `OptionalJwtAuthGuard` (optionnel) |

### Upload de fichiers

| Mesure | Implémentation |
|---|---|
| Extensions interdites | `.exe`, `.bat`, `.sh`, `.ps1`, `.cmd`, `.msi` |
| Taille maximale | Configurable via `MAX_FILE_SIZE` (défaut : 1 Go) |
| Noms de fichiers stockés | `crypto.randomBytes(16).toString('hex') + ext` — jamais le nom original |
| Tokens de partage | `crypto.randomBytes(16).toString('base64url')` — 128 bits d'entropie |
| Protection par mot de passe | `bcrypt` sur le mot de passe du fichier |

### Contrôle d'accès

| Vérification | Localisation |
|---|---|
| Propriété du fichier avant suppression | `files.service.ts` — `file.userId === userId` |
| Upload anonyme autorisé | `userId` peut être `null` en base |
| Accès download public | Via token URL, pas d'auth requise |
| Ownership check | Déclenche `ForbiddenException` si non-propriétaire |

### Base de données

| Mesure | Implémentation |
|---|---|
| ORM avec requêtes paramétrées | Prisma (pas de SQL brut) |
| Cascade delete | Tags supprimés avec le fichier (`onDelete: Cascade`) |
| Unicité | `email` unique (User), `token` unique (File) |

### CORS

```typescript
// api/src/main.ts
app.enableCors({ origin: 'http://localhost:5173' });
```

Seule l'origine frontend autorisée.

---

## Variables d'environnement sensibles

| Variable | Rôle | Ne jamais committer |
|---|---|---|
| `DATABASE_URL` | Connexion PostgreSQL | ✅ |
| `JWT_SECRET` | Signature des tokens | ✅ |
| `UPLOAD_DIR` | Répertoire uploads | — |
| `MAX_FILE_SIZE` | Limite taille fichier | — |

> Le fichier `api/.env` est dans `.gitignore`. Ne jamais le committer.

---

## Points non couverts (hors scope projet scolaire)

- Rate limiting (pas de protection brute-force sur `/auth/login`)
- HTTPS (serveur de développement uniquement)
- Scan antivirus des fichiers uploadés
- CSP headers
- CSRF protection (API stateless JWT, non applicable)

---

## Audit rapide

```bash
# Vérifier les dépendances vulnérables
cd api && npm audit
cd web && npm audit

# Vérifier les fichiers uploadés
ls api/uploads/
```
