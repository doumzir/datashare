# Schéma d'architecture — DataShare

> Ce fichier contient le code Mermaid du schéma d'architecture.
>
> **Rendu automatique sur GitHub.**
> **Pour draw.io** : ouvrir draw.io → Extras → Edit Diagram → sélectionner "Mermaid" → coller le code.

---

## Architecture globale

```mermaid
flowchart TB
    subgraph Browser["Navigateur (port 5173)"]
        SPA["React + Vite SPA\nReact Router v7 · Tailwind CSS v4"]
        subgraph Pages
            Home["/ Home\n(Upload)"]
            Login["/login"]
            Register["/register"]
            Dashboard["/dashboard"]
            Download["/download/:token"]
        end
    end

    subgraph API["NestJS REST API (port 3000)"]
        AuthModule["AuthModule\nPOST /auth/register\nPOST /auth/login"]
        FilesModule["FilesModule\nPOST /files/upload\nGET  /files/my\nGET  /files/:token\nGET  /files/:token/download\nPOST /files/:token/verify-password\nDELETE /files/:id"]
        Scheduler["SchedulerService\nCron 0 0 * * *\n(purge expirés)"]
        PrismaService["PrismaService\n(adapter-pg)"]
        StorageService["StorageService\n(filesystem)"]
    end

    subgraph Data["Données"]
        DB[(PostgreSQL 16\ndatashare\nUser · File · Tag)]
        FS["api/uploads/\nFichiers (noms aléatoires)"]
    end

    Browser -->|"HTTP REST\nAuthorization: Bearer JWT\nCORS: localhost:5173"| API
    AuthModule --> PrismaService
    FilesModule --> PrismaService
    FilesModule --> StorageService
    Scheduler --> PrismaService
    Scheduler --> StorageService
    PrismaService -->|"TCP · Prisma ORM"| DB
    StorageService -->|"I/O filesystem"| FS
```

---

## Flux d'upload

```mermaid
flowchart LR
    U([Utilisateur]) -->|"Sélectionne fichier\n+ options"| F[FileUploadForm]
    F -->|"POST /files/upload\nFormData + Bearer JWT"| API[NestJS API]
    API -->|"multer\nstocke fichier"| FS["uploads/\n<random>.ext"]
    API -->|"INSERT File\n+ Tags"| DB[(PostgreSQL)]
    API -->|"{ token, shareUrl }"| F
    F -->|"Affiche lien"| U
```

---

## Flux de téléchargement

```mermaid
flowchart LR
    V([Visiteur]) -->|"/download/:token"| DL[Download Page]
    DL -->|"GET /files/:token"| API[NestJS API]
    API -->|"métadonnées"| DL

    DL -->|"si hasPassword"| PWD{Formulaire\nmot de passe}
    PWD -->|"POST /files/:token/verify-password"| API
    API -->|"bcrypt.compare"| PWD

    DL -->|"GET /files/:token/download"| API
    API -->|"res.download()\nstream binaire"| V
```

---

## Flux d'authentification

```mermaid
sequenceDiagram
    actor U as Utilisateur
    participant SPA as React SPA
    participant API as NestJS API
    participant DB as PostgreSQL

    U->>SPA: Remplit formulaire register
    SPA->>API: POST /auth/register { email, password }
    API->>DB: bcrypt.hash(password) + INSERT User
    DB-->>API: User créé
    API-->>SPA: { access_token: JWT }
    SPA->>SPA: localStorage.setItem(token)
    SPA-->>U: Redirige vers /dashboard

    Note over U,DB: Connexion (même flux avec login)

    U->>SPA: Action protégée
    SPA->>API: GET /files/my\nAuthorization: Bearer JWT
    API->>API: JwtStrategy.validate(payload)
    API-->>SPA: [ ...fichiers ]
```
