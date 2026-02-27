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
✓ http_req_duration............: p(95) < 100ms (très en dessous du seuil de 500ms)
✓ http_req_failed..............: 0% (aucune erreur)
```

**Interprétation** : Sur un serveur local, la latence PostgreSQL est quasi nulle. Le seuil de 500ms est très largement respecté. En production avec latence réseau, surveiller le p(95) et ajuster le pool de connexions si nécessaire.

### Métriques k6 clés

| Métrique | Description |
|---|---|
| `http_req_duration` | Temps de réponse complet |
| `http_req_failed` | Taux d'erreurs (status >= 400) |
| `http_reqs` | Nombre total de requêtes |
| `vus` | Utilisateurs virtuels actifs |
| `iterations` | Nombre d'exécutions de `default()` |

---

## Budget de performance frontend

### Build de production

Exécuté le 2026-02-27 avec `npm run build` (Vite 7).

| Asset | Taille brute | Taille gzip |
|---|---|---|
| `index.js` (bundle JS) | 250.15 kB | **78.15 kB** |
| `index.css` (Tailwind) | 15.95 kB | 3.82 kB |
| `index.html` | 0.45 kB | 0.29 kB |
| **Total** | **~267 kB** | **~82 kB** |

### Analyse du bundle

- **78 kB gzip** — en dessous du budget recommandé de 100 kB gzip pour les SPA React
- Le bundle inclut React, React Router v7, React DOM — représentent ~70% du JS total
- Tailwind CSS en production est purgé (seules les classes utilisées) → 15.95 kB non gzip

### Budget de performance (objectifs)

| Métrique | Budget | Statut |
|---|---|---|
| Bundle JS gzip | < 100 kB | ✅ 78 kB |
| CSS gzip | < 10 kB | ⚠ 3.82 kB (OK en gzip, 16 kB brut) |
| Time to Interactive | < 3s (3G) | Non mesuré (dev local) |
| First Contentful Paint | < 1.5s | Non mesuré (dev local) |

### Métriques clés serveur

| Métrique | Valeur observée | Contexte |
|---|---|---|
| Temps de réponse `GET /files/my` | < 50ms | Local, PostgreSQL sur même machine |
| Taille réponse JSON (liste vide) | ~50 bytes | `[]` |
| Taille réponse JSON (10 fichiers) | ~3-5 kB | Avec tags |

### Optimisations possibles

| Action | Gain estimé | Priorité |
|---|---|---|
| Code splitting (lazy loading des pages) | -20 à -30 kB JS initial | Moyen |
| Cache HTTP sur `GET /files/:token` | Réduction requêtes répétées | Faible |
| Redis cache pour `GET /files/my` | -10 à -30ms latence | Faible |
| Pagination sur `GET /files/my` | Scalabilité avec grands volumes | Moyen |
| CDN pour assets statiques | -50 à -200ms selon géographie | Production uniquement |

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
