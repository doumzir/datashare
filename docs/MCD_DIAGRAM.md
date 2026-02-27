# MCD — Modèle Conceptuel de Données — DataShare

> Ce fichier contient le code Mermaid du MCD (diagramme entité-relation).
>
> **Rendu automatique sur GitHub.**
> **Pour draw.io** : ouvrir draw.io → Extras → Edit Diagram → sélectionner "Mermaid" → coller le code.

---

## Diagramme Entité-Relation

```mermaid
erDiagram
    USER {
        String id PK "cuid()"
        String email UK "unique, format email"
        String password "bcrypt hash"
        DateTime createdAt "default: now()"
    }

    FILE {
        String id PK "cuid()"
        String token UK "crypto.randomBytes(16).base64url — lien partage"
        String originalName "nom affiché à l'utilisateur"
        String storedName "nom sur disque (aléatoire)"
        String mimeType "ex: application/pdf"
        Int size "taille en octets"
        String path "chemin absolu fichier"
        DateTime expiresAt "date d'expiration"
        DateTime createdAt "default: now()"
        String password "bcrypt hash — nullable (protection optionnelle)"
        String userId FK "nullable — null = upload anonyme"
        Int downloadCount "default: 0"
    }

    TAG {
        String id PK "cuid()"
        String name "ex: projet, 2026"
        String fileId FK "référence vers File"
    }

    USER ||--o{ FILE : "possède (nullable = anonyme)"
    FILE ||--o{ TAG : "a (cascade delete)"
```

---

## Contraintes et règles métier

| Contrainte | Détail |
|---|---|
| `User.email` | Unique — empêche la double inscription |
| `File.token` | Unique — garantit l'unicité du lien de partage |
| `File.userId` | Nullable — `null` = upload anonyme (US07) |
| `File.password` | Nullable — `null` = pas de protection |
| `Tag(name, fileId)` | Unique composé — pas de tag dupliqué sur un même fichier |
| `onDelete: Cascade` | Supprimer un File supprime tous ses Tags |

---

## Cardinalités

| Relation | Cardinalité | Signification |
|---|---|---|
| User → File | 1 à N (optionnel) | Un utilisateur peut avoir 0 ou plusieurs fichiers |
| File → Tag | 1 à N (optionnel) | Un fichier peut avoir 0 ou plusieurs tags |
| File → User | N à 1 (nullable) | Un fichier appartient à 0 ou 1 utilisateur |
| Tag → File | N à 1 (requis) | Un tag appartient à exactement 1 fichier |
