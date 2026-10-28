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
