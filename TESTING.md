# TESTING — DataShare

## Vue d'ensemble

| Couche | Outil | Fichiers |
|---|---|---|
| Backend (unit) | Jest (NestJS natif) | `api/src/**/*.spec.ts` |
| Frontend (unit) | Vitest + jsdom | `web/src/**/*.test.{ts,tsx}` |
| E2E | Playwright | `web/e2e/**/*.spec.ts` |
| Performance | k6 | `scripts/load-test.js` |

---

## Tests Backend — Jest

### Lancer les tests

```bash
cd api
npx jest               # tous les tests
npx jest --coverage    # avec couverture
npx jest --watch       # mode watch
```

### Résultats

```
Test Suites: 4 passed, 4 total
Tests:       21 passed, 21 total
```

### Couverture

| Module | Statements | Branches | Fonctions |
|---|---|---|---|
| auth.service.ts | 100% | 83% | 100% |
| files.service.ts | 91% | 78% | 60% |
| storage.service.ts | 100% | 100% | 100% |
| Ensemble | 38% | 41% | 33% |

> La couverture globale est basse car les modules NestJS, contrôleurs et guards ne sont pas testés unitairement — ils le sont via les tests E2E Playwright.

### Fichiers de test

- `api/src/auth/auth.service.spec.ts` — register, login valide, mauvais mot de passe, utilisateur inconnu
- `api/src/files/files.service.spec.ts` — upload, extension interdite, mot de passe hashé, upload anonyme, getByToken, getMyFiles, deleteById, verifyPassword
- `api/src/files/storage.service.spec.ts` — getFilePath, deleteFile (existe / n'existe pas)
- `api/src/app.controller.spec.ts` — health check

---

## Tests Frontend — Vitest

### Lancer les tests

```bash
cd web
npx vitest run            # tous les tests
npx vitest run --coverage # avec couverture
npx vitest                # mode watch
```

### Résultats

```
Test Files: 2 passed (2)
Tests:      12 passed (12)
```

### Couverture

| Fichier | Statements | Branches | Fonctions |
|---|---|---|---|
| TagInput.tsx | 100% | 100% | 100% |
| api.ts (token helpers) | 17% | 0% | 23% |
| Ensemble src/ | 9.6% | 11.8% | 13.6% |

> La couverture frontend est volontairement basse sur les composants React car ces derniers sont testés end-to-end via Playwright. Les helpers purs (token localStorage, logique TagInput) sont couverts unitairement.

### Fichiers de test

- `web/src/lib/api.test.ts` — getToken, saveToken, removeToken, getDownloadUrl
- `web/src/components/TagInput.test.tsx` — rendu initial, ajout/suppression de tags, validation, gestion clavier

---

## Tests E2E — Playwright

### Prérequis

```bash
cd web
npx playwright install chromium
```

### Lancer les tests

```bash
cd web
npx playwright test              # headless (CI)
npx playwright test --headed     # avec navigateur visible
npx playwright test --ui         # interface graphique
```

> Playwright démarre automatiquement l'API NestJS (port 3000) et le serveur Vite (port 5173) avant les tests.

### Scénarios couverts

| Fichier | Scénario | Tests |
|---|---|---|
| `auth.spec.ts` | Inscription → Connexion → Dashboard | 3 |
| `upload-download.spec.ts` | Upload authentifié → Téléchargement → Dashboard | 2 |
| `anonymous-upload.spec.ts` | Upload anonyme + protection par mot de passe | 2 |

**Total : 7 tests E2E**

---

## Tests de performance — k6

### Prérequis

```bash
brew install k6
```

### Lancer le test

```bash
# Depuis la racine du projet
k6 run scripts/load-test.js
```

### Scénario

- Montée en charge : 0 → 5 VUs en 10s
- Charge nominale : 10 VUs pendant 20s
- Descente : 10 → 0 VUs en 10s

### Seuils de performance

| Métrique | Seuil |
|---|---|
| `http_req_duration` p(95) | < 500ms |
| `http_req_failed` rate | < 1% |

---

## Stratégie de test globale

```
Pyramid de tests :
                    [E2E Playwright]   ← 7 tests, flux complets
                 [Vitest / Jest unit]  ← 33 tests, logique métier
              [k6 load test]           ← performance sous charge
```

- **Unit tests** : logique métier pure (services, helpers) — rapides, isolés
- **E2E** : flux utilisateur complets de bout en bout — lents, réalistes
- **Perf** : vérification que l'API tient sous charge avant livraison
