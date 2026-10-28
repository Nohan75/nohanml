# nohanml

Nohan's personal portfolio: a public site (home, projects, experiences, about, contact form) and an admin area under `/admin` where the single admin edits all of its content. Solo developer: Nohan.

- Production: `https://nohanml.com` (frontend) and `https://nohanml-backend.fly.dev/api/v1` (API).
- Monorepo of two independent apps, `frontend/` and `backend/`, each with its own `yarn.lock` and `node_modules`; there are no workspaces.
- Interface text and `README.md` are in French; commits, pull requests, tickets and agent docs are in English.

## Stack

| Part | Technology | Hosting |
|---|---|---|
| Frontend | Angular 21 (standalone, signals, NgRx Signal Store), SCSS | Vercel |
| Backend | NestJS 10, TypeORM, class-validator, Swagger | Fly.io, app `nohanml-backend`, region `cdg` |
| Database | PostgreSQL | Supabase |
| Images | Supabase Storage, bucket `portfolio` | Supabase |
| Contact email | Resend | |
| Admin auth | email and password from env vars, exchanged for a 7-day JWT kept in `localStorage` | |
| Analytics | Vercel Analytics, `/admin` URLs excluded | Vercel |

## Structure

```
nohanml/
├── AGENTS.md                 # this file; CLAUDE.md imports it
├── .claude/skills/           # project skills (see "Skills" below)
├── .github/workflows/        # CI per app, triggered by changes under its folder
├── backend/                  # NestJS API, global prefix /api/v1
│   ├── Dockerfile, fly.toml
│   ├── .env.example          # every variable the API reads
│   └── src/
│       ├── main.ts           # helmet, CORS, ValidationPipe, Swagger outside production
│       ├── app.module.ts     # TypeORM config, module list
│       ├── common/           # JwtAuthGuard, AllExceptionsFilter, LoggingInterceptor
│       └── modules/          # auth, contact, experiences, health, profile, projects, skills, stats, upload
└── frontend/                 # Angular app
    ├── vercel.json           # SPA rewrites, output folder
    └── src/
        ├── environments/     # apiUrl per build configuration
        ├── styles.scss       # theme variables (dark and light), global classes
        └── app/
            ├── core/         # shared components, services, models, guard, interceptor
            ├── features/     # public pages, and admin/ for the admin area
            └── store/        # one signalStore per resource
```

## Data model

TypeORM entities are the source of truth for the schema (see "Database" below).

| Entity | Table | Holds |
|---|---|---|
| `Profile` | `profile` | a single row: hero texts, bio, contact email (the contact form's recipient), location, availability, CV and social links |
| `Project` | `projects` | title, description, `stack` (text array), GitHub, live and image URLs |
| `Skill` | `skills` | name, category, display order |
| `Experience` | `experiences` | title, company, location, free-text start and end dates, description, thumbnail and photo URLs |

## API

All routes are under `/api/v1`; Swagger lists them at `http://localhost:3000/api/docs` outside production.

```
# Public
GET    /health
GET    /profile
GET    /projects   /projects/:id
GET    /skills
GET    /experiences   /experiences/:id
POST   /contact                       → email through Resend to the profile's address
POST   /auth/login                    → { access_token }

# Admin (Bearer JWT)
GET    /admin/stats
POST   /admin/upload                  → image to Supabase Storage, returns { url }
POST   /admin/experiences   PATCH|DELETE /admin/experiences/:id

# Writes still outside admin/ and unguarded, until NML-86
POST|PATCH /profile
POST   /projects   PATCH|DELETE /projects/:id
POST   /skills     PATCH|DELETE /skills/:id
```

## Local development

- Frontend: `yarn --cwd frontend start`, served at `http://localhost:4200`, calling the API at `http://localhost:3000/api/v1`.
- Backend: `yarn --cwd backend start:dev`, run by the developer only (see "Database").
- CI and the Docker image use Node 20.

## Working in this repo

- **Database**: `backend/.env` may point at the production Supabase database, and TypeORM `synchronize` rewrites its schema whenever the backend starts outside production. Agents never start the backend or connect to the database; tests and builds are the verification.
- **Skills** live in `.claude/skills/`. An agent without the Skill tool reads the file before starting:
  - backend change (module, endpoint, entity, DTO, environment variable): `.claude/skills/api-resource/SKILL.md`;
  - frontend change (page, admin screen, component, service, store, style): `.claude/skills/angular-feature/SKILL.md`;
  - planning, writing or running tests: `.claude/skills/writing-tests/SKILL.md`;
  - shipping to production: `/deploy`, run by the developer.
- **Keeping docs true**: a change to anything this file or a skill describes (a route, an entity, a command, a path) updates it in the same pull request.

## dev-workflow

Rules for `/dev-workflow:ticket` and `/dev-workflow:parallel`, written by `/dev-workflow:setup`.

- **Tickets**: Linear, team `NML`, project `NML Portfolio` (IDs like `NML-21`). Read one with the Linear MCP server (`get_issue` with the ID). Ready to work on: issues in status `Todo`.
- **Base branch**: `main`.
- **Branch names**: `<type>/<ticket-id>-<slug>`, ticket ID in lowercase, where `<type>` is the Conventional Commits type (`feat`, `fix`, `docs`…), for example `feat/nml-21-admin-dashboard`.
- **Commits**: Conventional Commits in English, lowercase subject, no scope, for example `fix: make all cards the same height in grid layouts`. Name the ticket in the body (`Closes NML-21`).
- **Pull requests**: against `main`, body written with the `mattpocock-skills:pr` skill; pushed and opened only when the developer asks.
- **Checks**: before handing over, for each app the change touches (as CI does):
  - backend: `yarn --cwd backend lint && yarn --cwd backend build && yarn --cwd backend test` (`lint` runs with `--fix` and may rewrite files);
  - frontend: `yarn --cwd frontend lint && yarn --cwd frontend build:prod`, plus `yarn --cwd frontend test --watch=false --browsers=ChromeHeadless` once spec files exist.
- **Prepare a worktree**: nothing.
- **Clone into worktrees**: `node_modules`.
- **Add a dependency**: `yarn --cwd <frontend|backend> add <package>` (Yarn 1, one lock file per app).
- **In parallel**: 3 tickets at most.
