---
name: api-resource
description: Conventions for nohanml's NestJS API in `backend/`. Use when adding or changing a backend module, endpoint, entity or column, DTO, or environment variable.
---

# API resource

`backend/src/modules/experiences/` is the reference resource: copy its shape.

## Shape

```
backend/src/modules/<plural>/
├── <singular>.entity.ts
├── dto/<singular>.dto.ts     # Create<X>Dto, and Update<X>Dto = PartialType(Create<X>Dto)
├── <plural>.controller.ts    # public controller + admin controller
├── <plural>.service.ts
└── <plural>.module.ts        # TypeOrmModule.forFeature([<X>]) + AuthModule
```

Register the module in `src/app.module.ts`; `autoLoadEntities` picks up the entity, and the CLI data source (`src/data-source.ts`) finds it by its `*.entity.ts` file name.

## Routes: public reads, admin writes

- The public controller, `@Controller('<plural>')`, holds only `GET` routes.
- The admin controller, `@Controller('admin/<plural>')` with `@ApiBearerAuth()` and `@UseGuards(JwtAuthGuard)`, holds every `POST`, `PATCH` and `DELETE`. Its module imports `AuthModule`, which exports the `JwtModule` the guard needs.
- The `admin/` prefix is load-bearing on both sides: the frontend `authInterceptor` attaches the token only to URLs containing `/admin`.
- Every route has `@ApiTags` and `@ApiOperation({ summary })`; Swagger serves them at `/api/docs` outside production.
- Ids go through `ParseIntPipe`; `DELETE` returns `@HttpCode(HttpStatus.NO_CONTENT)`.

## DTOs

The global `ValidationPipe` runs with `whitelist` and `forbidNonWhitelisted`, so a request carrying a field that has no class-validator decorator fails with 400. Give every DTO field its class-validator decorators plus `@ApiProperty` or `@ApiPropertyOptional`, mirror the entity's length limits with `@MaxLength`, and import `PartialType` from `@nestjs/swagger` so Swagger sees the optional fields.

## Services and errors

Inject the repository with `@InjectRepository(<X>)`. `findOne` throws `NotFoundException` and is reused by `update` and `remove`. The global `AllExceptionsFilter` shapes every error response, so throw Nest exceptions and let it format them.

Images are uploaded through the existing `POST admin/upload` (Supabase Storage); an entity stores the returned public URL in a string column (`thumbnailUrl`, `photos: text[]`).

## Schema changes

TypeORM `synchronize` is off everywhere: the schema changes only through the migrations in `src/migrations/`. In production, the release command in `fly.toml` applies the pending ones on each deploy, before the new machines start.

- Agents never use the developer's `nohanml` database, nor production: `backend/.env` points at `nohanml` (and `.worktreeinclude` copies it into every worktree), so a bare `migration:*`, `seed` or `start` command would hit the developer's tables. Agents run the backend, the migration scripts and the seed on their own scratch database `nohanml_<ticket-id>` (e.g. `nohanml_nml_123`) in the local Docker container, and write `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nohanml_<ticket-id> DATABASE_SSL=false` before every such command (shell variables win over `backend/.env`). Create it with `docker compose -f backend/docker-compose.yml exec -T db createdb -U postgres nohanml_<ticket-id>` then `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nohanml_<ticket-id> DATABASE_SSL=false yarn --cwd backend migration:run`; drop it when the ticket is done with `… exec -T db dropdb -U postgres --if-exists nohanml_<ticket-id>`. Same rule as "Database" in `AGENTS.md`.
- Each entity change ships with its migration, in the same pull request. With the scratch database migrated up to date, `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nohanml_<ticket-id> DATABASE_SSL=false yarn --cwd backend migration:generate src/migrations/<Name>` writes `src/migrations/<timestamp>-<Name>.ts` from the difference between the entities and the database. It writes TypeORM's template (double quotes, 4 spaces): format the new file with `yarn --cwd backend prettier --single-quote --trailing-comma all --write src/migrations/<file>`, and never run `yarn format`, which as configured would rewrite the backend to double quotes.
- Review its SQL before applying it: column types and lengths, defaults, nullability, and a `down` that undoes exactly the `up`, in reverse order.
- Apply it with `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nohanml_<ticket-id> DATABASE_SSL=false yarn --cwd backend migration:run`, then check with `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nohanml_<ticket-id> DATABASE_SSL=false yarn --cwd backend migration:generate src/migrations/Check --check`: it prints "No changes in database schema were found" and writes no file. `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nohanml_<ticket-id> DATABASE_SSL=false yarn --cwd backend migration:show` lists the migrations, `[X]` for the applied ones.
- Never edit a migration once it is merged: production may have run it. Fix it with a new migration. A migration not yet merged can be undone with `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nohanml_<ticket-id> DATABASE_SSL=false yarn --cwd backend migration:revert`, deleted and generated again.
- Prefer additive changes: a new nullable column, or one with a `default`, which the production code still running can ignore. Renaming or removing a column, or narrowing its type, destroys data and breaks production once deployed: stop and ask the developer.
- The hand-over names each new migration and what it changes.

## Configuration

Read settings with `ConfigService.get<string>('NAME')`. A new variable gets a placeholder line in `backend/.env.example`, and the hand-over names it so the developer sets it locally and as a Fly.io secret. The placeholder must be non-empty (a provider client throws on an empty key), and `backend/src/env-example.spec.ts` fails when the file and the variables the source reads differ.

## Done when

- every write route sits under `admin/` behind `JwtAuthGuard`;
- the module is registered in `app.module.ts`;
- every DTO field is decorated;
- every new variable is in `.env.example`;
- every entity change has its reviewed migration in `src/migrations/`, and `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/nohanml_<ticket-id> DATABASE_SSL=false yarn --cwd backend migration:generate src/migrations/Check --check` finds no changes.
