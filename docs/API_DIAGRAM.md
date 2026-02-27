# Contrat d'interface — API DataShare

> Ce fichier contient les diagrammes Mermaid du contrat d'interface frontend/backend.
>
> **Rendu automatique sur GitHub.**
> **Pour draw.io** : ouvrir draw.io → Extras → Edit Diagram → sélectionner "Mermaid" → coller le code.

---

## Vue d'ensemble des endpoints

```mermaid
flowchart LR
    subgraph Public["Routes publiques (sans auth)"]
        R1["POST /auth/register"]
        R2["POST /auth/login"]
        R3["GET  /files/:token"]
        R4["GET  /files/:token/download"]
        R5["POST /files/:token/verify-password"]
    end

    subgraph Optional["Auth optionnelle"]
        R6["POST /files/upload"]
    end

    subgraph Protected["Auth requise (Bearer JWT)"]
        R7["GET    /files/my"]
        R8["DELETE /files/:id"]
    end

    Client -->|"JSON"| Public
    Client -->|"FormData"| Optional
    Client -->|"Bearer JWT"| Protected
```

---

## Séquence : Inscription + Upload + Téléchargement

```mermaid
sequenceDiagram
    actor U as Utilisateur
    participant SPA
    participant API

    %% Inscription
    U->>SPA: POST /auth/register
    Note right of API: 201 { access_token }
    Note right of API: 409 Email already in use

    %% Upload
    U->>SPA: POST /files/upload (FormData)
    Note right of SPA: fields: expiresIn?, password?, tags?
    Note right of API: 201 { id, token, shareUrl }
    Note right of API: 400 Extension interdite
    Note right of API: 413 Fichier trop grand

    %% Téléchargement
    U->>SPA: GET /files/:token
    Note right of API: 200 { originalName, mimeType, size, hasPassword, ... }
    Note right of API: 404 Not found

    U->>SPA: GET /files/:token/download
    Note right of API: 200 stream binaire (Content-Disposition: attachment)
    Note right of API: 403 Mot de passe requis
```

---

## Format des corps de requête / réponse

```mermaid
classDiagram
    class RegisterDTO {
        +String email
        +String password
    }

    class LoginDTO {
        +String email
        +String password
    }

    class AuthResponse {
        +String access_token
    }

    class UploadFileDTO {
        +File file
        +Number expiresIn "1-7 jours"
        +String password "optionnel, min 6 chars"
        +String tags "optionnel, CSV ex: projet,2026"
    }

    class FileResponse {
        +String id
        +String token
        +String originalName
        +String mimeType
        +Number size
        +DateTime expiresAt
        +Boolean hasPassword
        +String[] tags
        +Number downloadCount
    }

    class UploadResponse {
        +String id
        +String token
        +String shareUrl
    }

    RegisterDTO --> AuthResponse : POST /auth/register
    LoginDTO --> AuthResponse : POST /auth/login
    UploadFileDTO --> UploadResponse : POST /files/upload
    FileResponse --> FileResponse : GET /files/token
```

---

## Codes d'erreur

| Code | Route(s) | Cause |
|---|---|---|
| 400 | `/files/upload` | Extension interdite ou validation DTO |
| 401 | `/auth/login` | Email/mot de passe incorrect |
| 403 | `/files/:id (DELETE)` | Tentative de suppression d'un fichier d'autrui |
| 403 | `/files/:token/download` | Fichier protégé, vérification requise |
| 404 | `/files/:token` | Token inconnu ou fichier expiré |
| 409 | `/auth/register` | Email déjà utilisé |
| 413 | `/files/upload` | Fichier > MAX_FILE_SIZE (1 Go) |
