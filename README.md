# nohanml — Portfolio

Monorepo contenant le frontend Angular 21 et le backend NestJS 10 de mon portfolio personnel.

## Structure

```
nohanml/
├── frontend/   # Angular 21 — déployé sur Vercel
└── backend/    # NestJS 10 — déployé sur Fly.io
```

## Tech stack

| Couche | Technologies |
|---|---|
| **Frontend** | Angular 21, NgRx Signal Store, SCSS, standalone components, OnPush |
| **Backend** | NestJS 10, TypeORM, PostgreSQL (Supabase), Resend, JWT |
| **Infra** | Vercel (frontend), Fly.io (backend), Supabase (BDD) |
| **CI** | GitHub Actions : lint, tests et build (frontend et backend), sans déploiement |

---

## Démarrage local

> Le projet utilise **Yarn**. Ne pas utiliser `npm`.

### Prérequis

- Node.js ≥ 20
- Yarn
- Docker (pour la base PostgreSQL locale)

### Frontend

```bash
cd frontend
yarn
yarn start
# → http://localhost:4200
```

### Backend

```bash
yarn --cwd backend
cp backend/.env.example backend/.env
# Remplir backend/.env avec les vraies valeurs
docker compose -f backend/docker-compose.yml up -d
yarn --cwd backend migration:run
yarn --cwd backend seed
yarn --cwd backend start:dev
# → http://localhost:3000/api/v1
# → http://localhost:3000/api/docs  (Swagger, dev uniquement)
```

### Migrations

Le schéma de la base n'est jamais synchronisé automatiquement : il évolue uniquement par les migrations TypeORM de `backend/src/migrations/`. Sans schéma, le seed s'arrête et indique `yarn --cwd backend migration:run`.

```bash
yarn --cwd backend migration:run                                    # applique les migrations en attente
yarn --cwd backend migration:show                                   # liste les migrations, [X] = appliquée
yarn --cwd backend migration:generate src/migrations/<Nom>          # génère une migration après un changement d'entité
yarn --cwd backend migration:generate src/migrations/Check --check  # vérifie que la base correspond aux entités
yarn --cwd backend migration:revert                                 # annule la dernière migration appliquée
```

Une base locale créée avant les migrations (tables créées par `synchronize`, sans table `migrations`) fait échouer `migration:run` (`relation "…" already exists`). La recréer, en perdant ses données locales :

```bash
docker compose -f backend/docker-compose.yml down -v
docker compose -f backend/docker-compose.yml up -d
yarn --cwd backend migration:run
yarn --cwd backend seed
```

---

## Variables d'environnement

Copier `backend/.env.example` et renseigner chaque variable :

```env
# Base de données PostgreSQL (locale via Docker ; en production, l'URL du Connection Pooler Supabase)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nohanml
# false désactive SSL (base locale) ; toute autre valeur ou l'absence de la variable garde SSL
DATABASE_SSL=false

# Facultatif en local (défaut : http://localhost:4200) ; en production, obligatoire : l'origine du frontend, sinon le navigateur bloque tous les appels à l'API
CORS_ORIGIN=http://localhost:4200
# Facultatif : port du serveur (défaut dans le code)
PORT=3000
# `production` en prod (masque Swagger et le détail des erreurs 500), `development` en local
NODE_ENV=development

# JWT : clé secrète longue et aléatoire
JWT_SECRET=change-this-to-a-long-random-secret

# Compte administrateur
ADMIN_EMAIL=your@email.com
ADMIN_PASSWORD=your-admin-password

# Resend : clé API non vide, sinon le backend ne démarre pas (avec ce placeholder, seul /contact échoue)
RESEND_API_KEY=re_xxxxxxxx
# Facultatif : expéditeur du mail de contact (défaut dans le code)
MAIL_FROM=contact@nohanml.com
# Facultatif : destinataire de secours, utilisé seulement si aucun profil n'existe en base
MAIL_TO=your@email.com

# Supabase Storage : upload d'images. SUPABASE_URL (URL http(s)) et SUPABASE_SERVICE_ROLE_KEY non vides, sinon le backend ne démarre pas
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
# Facultatif : nom du bucket (défaut dans le code)
SUPABASE_STORAGE_BUCKET=portfolio
```

> **Note Supabase** : en production sur Fly.io, utiliser l'URL du **Connection Pooler** (domaine `aws-1-eu-north-1.pooler.supabase.com`) et non l'URL directe.

---

## Modules backend

Toutes les routes sont préfixées par `/api/v1`. Les routes `admin/...` exigent un JWT (`Authorization: Bearer`).

| Module | Routes | Description |
|---|---|---|
| `health` | `GET /health` | Healthcheck |
| `profile` | `GET /profile`<br>`POST`, `PATCH /admin/profile` | Infos publiques du profil ; édition (admin) |
| `projects` | `GET /projects`, `GET /projects/:id`<br>`POST /admin/projects`, `PATCH`, `DELETE /admin/projects/:id` | Projets ; gestion (admin) |
| `skills` | `GET /skills`<br>`POST /admin/skills`, `PATCH`, `DELETE /admin/skills/:id` | Compétences ; gestion (admin) |
| `experiences` | `GET /experiences`, `GET /experiences/:id`<br>`POST /admin/experiences`, `PATCH`, `DELETE /admin/experiences/:id` | Expériences ; gestion (admin) |
| `contact` | `POST /contact` | Envoi de mail via Resend |
| `auth` | `POST /auth/login` | Authentification admin (JWT) |
| `stats` | `GET /admin/stats` | Statistiques du portfolio (admin) |
| `upload` | `POST /admin/upload` | Upload d'image vers Supabase Storage (admin) |

---

## Déploiement

Le détail des étapes (vérifications, déploiement, rollback, secrets) est dans [`.claude/skills/deploy/SKILL.md`](.claude/skills/deploy/SKILL.md).

- **Frontend (Vercel)** : déploiement en production à chaque push sur `main`, et un aperçu par branche. Le `frontend/vercel.json` gère les rewrites SPA.
- **Backend (Fly.io)** : app `nohanml-backend` (`backend/fly.toml`, build via `backend/Dockerfile`). Aucun déploiement automatique : `fly deploy backend`, lancé à la main. Avant de démarrer les nouvelles machines, Fly applique les migrations en attente (`release_command` de `backend/fly.toml`) et annule le déploiement si elles échouent.
- **Secrets** : les variables sont les noms de `backend/.env.example`, définies avec `fly secrets set`.

---

## CI

GitHub Actions, sur chaque push et pull request vers `main` ou `develop`, filtrés par dossier :

- **Frontend** (`frontend/**`) : lint, tests Karma (ChromeHeadless), build de production.
- **Backend** (`backend/**`) : lint, build, tests.
