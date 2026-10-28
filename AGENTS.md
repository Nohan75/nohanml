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

## Working in this repo

- **Database**: `backend/.env` may point at the production Supabase database, and TypeORM `synchronize` rewrites its schema whenever the backend starts outside production. Agents never start the backend or connect to the database; tests and builds are the verification.
- **Skills** live in `.claude/skills/`. An agent without the Skill tool reads the file before starting:
  - backend change (module, endpoint, entity, DTO, environment variable): `.claude/skills/api-resource/SKILL.md`;
  - frontend change (page, admin screen, component, service, store, style): `.claude/skills/angular-feature/SKILL.md`;
  - planning, writing or running tests: `.claude/skills/writing-tests/SKILL.md`;
  - shipping to production: `/deploy`, run by the developer.
