---
name: deploy
description: Ship nohanml to production (backend on Fly.io, frontend on Vercel) and manage its secrets.
disable-model-invocation: true
---

# Deploy

| App | Host | Production URL |
|---|---|---|
| backend | Fly.io app `nohanml-backend`, region `cdg`, built from `backend/Dockerfile` | `https://nohanml-backend.fly.dev/api/v1` |
| frontend | Vercel, root directory `frontend`, settings in `frontend/vercel.json` | the Vercel project's domain |

`README.md` and `backend/railway.toml` still describe the former Railway hosting; `backend/fly.toml` is the source of truth.

## 1. Before shipping

- What ships is on `main`, and the checks from `AGENTS.md` pass for each app it touches.
- Entity changes: production runs with TypeORM `synchronize` off, so the production schema must already match the entities. Ask the developer how each entity change was applied before deploying the backend.
- New backend variables are set as Fly secrets (section 4) before the deploy that reads them.

## 2. Frontend

Vercel builds and deploys `frontend/` on every push to `main`: merging is shipping. Follow the deployment in the Vercel dashboard or with the Vercel MCP tools, then open the site.

## 3. Backend

Whether a push to `main` also deploys to Fly.io is unconfirmed. Before the first deploy from this skill, ask the developer, then replace this paragraph with the answer.

1. `fly auth whoami`. When the session has expired, the developer runs `! fly auth login`.
2. `fly deploy backend`, after the developer confirms.
3. `fly status -a nohanml-backend`, then `curl -fsS https://nohanml-backend.fly.dev/api/v1/health` returns `{"status":"ok",…}`. Machines stop when idle (`min_machines_running = 0`), so the first request can take a few seconds.
4. Rollback: `fly releases -a nohanml-backend --image` lists previous images; `fly deploy backend --image <image>` puts one back.

## 4. Secrets

Backend settings live in Fly secrets; the frontend has none (`environment.prod.ts` holds the API URL at build time).

- `fly secrets list -a nohanml-backend` shows names only.
- The developer types the values: `! fly secrets set NAME=value -a nohanml-backend`. Setting a secret restarts the machines.
- `CORS_ORIGIN` must equal the frontend's origin, or the browser blocks every API call.
- Each variable also has a placeholder line in `backend/.env.example`.
