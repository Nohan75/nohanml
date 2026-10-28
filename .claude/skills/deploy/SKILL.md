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

## 1. Before shipping

- What ships is on `main`, and the checks from `AGENTS.md` pass for each app it touches.
- Entity changes ship as migrations in `backend/src/migrations/`, in the same pull request as the code (`.claude/skills/api-resource/SKILL.md`, "Schema changes"). The release command applies them on deploy (section 3); nothing is applied by hand in the Supabase SQL editor.
- New backend variables are set as Fly secrets (section 4) before the deploy that reads them.

## 2. Frontend

Vercel builds and deploys `frontend/` to production on every push to `main`: merging is shipping. Every other pushed branch gets a preview deployment, linked from its pull request. Follow the deployment in the Vercel dashboard or with the Vercel MCP tools, then open the site.

## 3. Backend

Nothing deploys the backend automatically: a merge to `main` reaches Fly.io only when someone runs `fly deploy`. To see what is waiting, take the date of the latest release in `fly releases -a nohanml-backend` and list `git log --since=<that date> -- backend/`.

1. `fly auth whoami`. When the session has expired, the developer runs `! fly auth login`.
2. `fly deploy backend`, after the developer confirms. Before the new machines start, Fly runs the release command of `backend/fly.toml` once, in the new image with the app's secrets: `node node_modules/typeorm/cli.js migration:run -d dist/data-source.js`. It applies the pending migrations in one transaction and prints "No migrations are pending" when there are none. It also logs every SQL query it runs: that is expected. When it fails ("Error during migration run:"), the transaction is rolled back, Fly cancels the deploy and the previous release keeps serving: read the error in the deploy output or `fly logs -a nohanml-backend`, fix it with a new migration, deploy again.
3. `fly status -a nohanml-backend`, then `curl -fsS https://nohanml-backend.fly.dev/api/v1/health` returns `{"status":"ok",…}`. Machines stop when idle (`min_machines_running = 0`), so the first request can take a few seconds.
4. Rollback, in this order:
   1. When the release to undo ran a migration whose schema change must go too, revert it first, after the developer confirms, from a started machine of that release (its image holds the migration's `down`; revert drops what `up` created, data included). One run reverts the latest migration: check which it is first with `fly ssh console -a nohanml-backend -C "sh -c 'cd /app && node node_modules/typeorm/cli.js migration:show -d dist/data-source.js'"`, and never revert `Init1793221933062` in production, its `down` drops every production table.
      `fly ssh console -a nohanml-backend -C "sh -c 'cd /app && node node_modules/typeorm/cli.js migration:revert -d dist/data-source.js'"`
   2. `fly releases -a nohanml-backend --image` lists previous images; `fly deploy backend --image <image>` puts one back. Its release command runs too, and prints "No migrations are pending". An image built before NML-91 has no `dist/data-source.js`, so the release command fails on it: deploy such an image from a checkout of its commit, whose `fly.toml` has no release command.

## 4. Secrets

Backend settings live in Fly secrets; the frontend has none (`environment.prod.ts` holds the API URL at build time).

- `fly secrets list -a nohanml-backend` shows names only.
- The developer types the values: `! fly secrets set NAME=value -a nohanml-backend`. Setting a secret restarts the machines.
- `CORS_ORIGIN` must equal the frontend's origin, or the browser blocks every API call.
- Each variable also has a placeholder line in `backend/.env.example`.

## 5. Checking the production schema

`fly ssh console` may not start in `/app`, hence the `sh -c 'cd /app && …'`. Run `curl -fsS https://nohanml-backend.fly.dev/api/v1/health` first, so that a machine is started.

- Applied migrations, `[X]` for each one: `fly ssh console -a nohanml-backend -C "sh -c 'cd /app && node node_modules/typeorm/cli.js migration:show -d dist/data-source.js'"`.
- Drift between the entities and the production schema: `fly ssh console -a nohanml-backend -C "sh -c 'cd /app && node node_modules/typeorm/cli.js migration:generate /tmp/Check --check -d dist/data-source.js'"` prints "No changes in database schema were found" (the path argument is required but nothing is written). The pg `DeprecationWarning: Calling client.query() when the client is already executing a query` it prints is harmless. When it lists changes instead, production differs from the entities: open a ticket for a corrective migration, never fix it by hand.
