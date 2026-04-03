# nohanml — Portfolio

Monorepo contenant le frontend Angular 21 et le backend NestJS 10 de mon portfolio personnel.

## Structure

```
nohanml/
├── frontend/   # Angular 21 — déployé sur Vercel
└── backend/    # NestJS 10 — déployé sur Railway
```

## Tech stack

| Couche | Technologies |
|---|---|
| **Frontend** | Angular 21, NgRx Signal Store, SCSS, standalone components, OnPush |
| **Backend** | NestJS 10, TypeORM, PostgreSQL (Supabase), Nodemailer, JWT |
| **Infra** | Vercel (frontend), Railway (backend), Supabase (BDD) |
| **CI/CD** | GitHub Actions avec cache Yarn |

---

## Démarrage local

> Le projet utilise **Yarn**. Ne pas utiliser `npm`.

### Prérequis

- Node.js ≥ 20
- Yarn
- Une base de données PostgreSQL (ou un projet Supabase)

### Frontend

```bash
cd frontend
yarn
yarn start
# → http://localhost:4200
```

### Backend

```bash
cd backend
yarn
cp .env.example .env
# Remplir .env avec les vraies valeurs
yarn start:dev
# → http://localhost:3000/api/v1
# → http://localhost:3000/api/docs  (Swagger, dev uniquement)
```

---

## Variables d'environnement

Copier `backend/.env.example` et renseigner chaque variable :

```env
# Base de données PostgreSQL (Supabase — utiliser l'URL du Connection Pooler)
DATABASE_URL=postgresql://user:password@aws-0-region.pooler.supabase.com:5432/postgres

# SMTP Hostinger (port 465, SSL)
MAIL_USER=contact@tondomaine.com
MAIL_PASS=ton-mot-de-passe-email-hostinger

# CORS — origine autorisée (URL Vercel en production)
CORS_ORIGIN=http://localhost:4200

# Serveur
PORT=3000
NODE_ENV=development

# JWT — clé secrète longue et aléatoire
JWT_SECRET=change-this-to-a-long-random-secret

# Compte administrateur
ADMIN_EMAIL=your@email.com
ADMIN_PASSWORD=your-admin-password
```

> **Note Supabase** : en production sur Railway, utiliser l'URL du **Connection Pooler** (domaine `aws-0-*.pooler.supabase.com`) et non l'URL directe, afin d'éviter les erreurs `ENETUNREACH` liées à l'IPv6.

---

## Modules backend

| Module | Route | Description |
|---|---|---|
| `health` | `GET /api/v1/health` | Healthcheck Railway |
| `profile` | `GET /api/v1/profile` | Infos publiques du profil |
| `projects` | `GET /api/v1/projects` | Liste des projets |
| `skills` | `GET /api/v1/skills` | Liste des compétences |
| `contact` | `POST /api/v1/contact` | Envoi de mail via SMTP Hostinger |
| `auth` | `POST /api/v1/auth/login` | Authentification admin (JWT) |
| `stats` | `GET /api/v1/stats` | Statistiques du portfolio (protégé JWT) |

---

## Déploiement

### Frontend — Vercel

1. Importer le repo sur [vercel.com](https://vercel.com)
2. Définir le **Root Directory** sur `frontend`
3. Framework : **Angular**
4. Le fichier `frontend/vercel.json` gère les rewrites SPA

### Backend — Railway

1. Créer un service depuis le repo GitHub
2. Définir le **Root Directory** sur `backend`
3. Railway utilise le `backend/Dockerfile` (build multi-stage, Node 20 Alpine)
4. Ajouter les variables d'environnement dans Railway :

```
DATABASE_URL=<URL pooler Supabase>
MAIL_USER=contact@tondomaine.com
MAIL_PASS=<mot de passe email Hostinger>
CORS_ORIGIN=https://<ton-projet>.vercel.app
JWT_SECRET=<clé secrète>
ADMIN_EMAIL=<ton email>
ADMIN_PASSWORD=<ton mot de passe admin>
NODE_ENV=production
```

---

## CI/CD

GitHub Actions déclenché sur chaque push sur `main` :

- Cache Yarn pour accélérer les builds
- Vercel et Railway se déploient automatiquement depuis le repo GitHub
