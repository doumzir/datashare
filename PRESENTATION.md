# Support de présentation — DataShare

> Plan des slides pour la soutenance. À convertir en PowerPoint / Google Slides / Reveal.js.

---

## Slide 1 — Titre

**DataShare**
Plateforme sécurisée de partage de fichiers

*Projet OpenClassrooms — [Votre nom] — [Date]*

---

## Slide 2 — Contexte et objectif

**Le problème :**
- Partager des fichiers de façon simple et sécurisée
- Sans compte obligatoire pour les destinataires
- Avec expiration automatique

**La solution : DataShare**
- Inspiré de WeTransfer
- Upload → lien unique → téléchargement
- Protection par mot de passe, tags, expiration automatique

---

## Slide 3 — Architecture technique

```
React + Vite SPA          NestJS REST API          PostgreSQL
(port 5173)       ←REST→  (port 3000)       ←ORM→  (Prisma)
                                ↕
                          api/uploads/
                          (stockage local)
```

**Choix imposés :** NestJS + React + PostgreSQL

**Choix libres :** Tailwind CSS, React Router v7, Prisma 7, JWT, bcrypt, Playwright

---

## Slide 4 — Fonctionnalités développées

| User Story | Description | Statut |
|---|---|---|
| US01 | Upload authentifié | ✅ |
| US02 | Téléchargement via lien token | ✅ |
| US03 | Inscription | ✅ |
| US04 | Connexion | ✅ |
| US05 | Dashboard historique | ✅ |
| US06 | Suppression fichier | ✅ |
| US07 | Upload anonyme | ✅ |
| US08 | Tags | ✅ |
| US09 | Protection par mot de passe | ✅ |
| US10 | Expiration automatique (cron) | ✅ |

---

## Slide 5 — Démonstration

**Parcours 1 — Utilisateur authentifié :**
1. Inscription / Connexion
2. Upload fichier avec tags + mot de passe
3. Partage du lien
4. Téléchargement via le lien (avec mot de passe)
5. Dashboard → suppression

**Parcours 2 — Utilisateur anonyme :**
1. Upload sans compte
2. Lien de partage généré
3. Téléchargement direct

---

## Slide 6 — Qualité et tests

**Tests écrits :**
- 21 tests Jest (backend) — services 91-100% de couverture
- 12 tests Vitest (frontend)
- 7 tests E2E Playwright — 3 scénarios complets

**Performance :**
- Bundle JS : 78 kB gzip (budget < 100 kB)
- API : p(95) < 100ms sous 10 utilisateurs simultanés

**Sécurité :**
- 0 vulnérabilité runtime (`npm audit web` → 0)
- 14 vulnérabilités modérées en devDependencies (outils CLI, non exploitables)

---

## Slide 7 — Utilisation de l'IA

**US confiée au copilote : US05 + US06** (Dashboard + Suppression)

**Tâche assignée :**
> "Implémente un composant FileCard avec métadonnées, lien copie, badge d'état, suppression avec confirmation. Crée la page Dashboard."

**Mon rôle :**
- Supervision des appels API (sécurité Bearer JWT)
- Validation flux confirmation suppression
- Correction de 3 imports TypeScript incorrects

**Bilan :**
- Gain de temps sur le code JSX répétitif ✅
- Imports TypeScript à corriger manuellement ⚠

---

## Slide 8 — Difficultés rencontrées

| Difficulté | Solution |
|---|---|
| Prisma 7 — `url` deprecated dans `schema.prisma` | Créé `prisma.config.ts` avec `datasource.url` |
| nanoid v5 ESM-only (incompatible CJS NestJS) | Remplacé par `crypto.randomBytes` natif Node.js |
| Vitest exécutait les fichiers Playwright | Ajouté `include`/`exclude` dans `vite.config.ts` |
| vite.config.ts : `test` non reconnu par TypeScript | Import `defineConfig` depuis `vitest/config` |

---

## Slide 9 — Ce que j'ai appris

- Architecture REST API séparée (NestJS) + SPA (React)
- Guards et stratégies Passport.js / JWT en NestJS
- Upload multipart avec multer
- Tests E2E complets avec Playwright
- Gestion de la sécurité : hash bcrypt, tokens aléatoires, ownership check
- Documentation technique structurée (TESTING, SECURITY, PERF, MAINTENANCE)

---

## Slide 10 — Lien et ressources

**GitHub :** https://github.com/doumzir/datashare

**Documentation dans le repo :**
- README.md — installation
- TECHNICAL_DOC.md — documentation technique complète
- TESTING.md / SECURITY.md / PERF.md / MAINTENANCE.md

---

*Merci de votre attention — Questions ?*
