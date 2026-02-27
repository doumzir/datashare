# PERF — DataShare

## Tests de charge avec k6

### Outil

[k6](https://k6.io/) — outil open-source de test de performance, scripts en JavaScript.

### Installation

```bash
brew install k6
```

### Lancer le test

```bash
# L'API NestJS doit tourner sur localhost:3000
cd api && npm run start:dev &

# Depuis la racine du projet
k6 run scripts/load-test.js
```

### Scénario de charge (`scripts/load-test.js`)

```
Phase 1 — Montée :   0 → 5 VUs  en 10s
Phase 2 — Nominale : 10 VUs     pendant 20s
Phase 3 — Descente : 10 → 0 VUs en 10s
Total : ~40s de test
```

**VU** = Virtual User (utilisateur virtuel concurrent)

### Flux testé par VU

1. `setup()` : création d'un compte (`POST /auth/register`) → récupération du JWT
2. `default()` : `GET /files/my` avec token → vérification statut 200 + durée < 200ms
3. `sleep(1)` entre chaque itération

### Seuils de performance (SLO)

| Métrique | Seuil | Signification |
|---|---|---|
| `http_req_duration` p(95) | < 500ms | 95% des requêtes répondent en moins de 500ms |
| `http_req_failed` | < 1% | Moins de 1% d'erreurs |

Si un seuil est dépassé, k6 retourne un code d'erreur (utilisable en CI).

### Résultats attendus

Pour une machine de développement locale avec PostgreSQL :

```
✓ http_req_duration............: p(95) < 100ms (très en dessous du seuil)
✓ http_req_failed..............: 0% (aucune erreur)
```

### Métriques k6 clés

| Métrique | Description |
|---|---|
| `http_req_duration` | Temps de réponse complet |
| `http_req_failed` | Taux d'erreurs (status >= 400) |
| `http_reqs` | Nombre total de requêtes |
| `vus` | Utilisateurs virtuels actifs |
| `iterations` | Nombre d'exécutions de `default()` |

---

## Optimisations en place

| Optimisation | Détail |
|---|---|
| Index DB | `token` (unique), `userId` (FK) — Prisma génère automatiquement |
| Connexion pool | `pg.Pool` dans PrismaService — réutilisation des connexions |
| Cron découplé | `SchedulerService` — purge des fichiers expirés la nuit, pas au runtime |
| Fichiers servis statiquement | Via `GET /files/:token/download` — streaming `res.download()` |

---

## Limites connues

- Pas de cache (Redis non implémenté — hors scope)
- Upload volumineux non testé sous charge (limité à 1 Go par fichier)
- Un seul nœud NestJS (pas de clustering)
