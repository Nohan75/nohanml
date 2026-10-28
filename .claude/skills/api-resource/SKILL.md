---
name: api-resource
description: Conventions for nohanml's NestJS API in `backend/`. Use when adding or changing a backend module, endpoint, entity or column, DTO, or environment variable.
---

# API resource

`backend/src/modules/experiences/` is the reference resource: copy its shape. The older `projects`, `skills` and `profile` modules predate it.

## Shape

```
backend/src/modules/<plural>/
├── <singular>.entity.ts
├── dto/<singular>.dto.ts     # Create<X>Dto, and Update<X>Dto = PartialType(Create<X>Dto)
├── <plural>.controller.ts    # public controller + admin controller
├── <plural>.service.ts
└── <plural>.module.ts        # TypeOrmModule.forFeature([<X>]) + AuthModule
```

Register the module in `src/app.module.ts`; `autoLoadEntities` picks up the entity.

## Routes: public reads, admin writes

- The public controller, `@Controller('<plural>')`, holds only `GET` routes.
- The admin controller, `@Controller('admin/<plural>')` with `@ApiBearerAuth()` and `@UseGuards(JwtAuthGuard)`, holds every `POST`, `PATCH` and `DELETE`. Its module imports `AuthModule`, which exports the `JwtModule` the guard needs.
- The `admin/` prefix is load-bearing on both sides: the frontend `authInterceptor` attaches the token only to URLs containing `/admin`.
- Every route has `@ApiTags` and `@ApiOperation({ summary })`; Swagger serves them at `/api/docs` outside production.
- Ids go through `ParseIntPipe`; `DELETE` returns `@HttpCode(HttpStatus.NO_CONTENT)`.

`projects`, `skills` and `profile` still expose unguarded writes outside `admin/`. Moving one is a ticket of its own: the backend route and the frontend service URL change together.

## DTOs

The global `ValidationPipe` runs with `whitelist` and `forbidNonWhitelisted`, so a request carrying a field that has no class-validator decorator fails with 400. Give every DTO field its class-validator decorators plus `@ApiProperty` or `@ApiPropertyOptional`, mirror the entity's length limits with `@MaxLength`, and import `PartialType` from `@nestjs/swagger` so Swagger sees the optional fields.

## Services and errors

Inject the repository with `@InjectRepository(<X>)`. `findOne` throws `NotFoundException` and is reused by `update` and `remove`. The global `AllExceptionsFilter` shapes every error response, so throw Nest exceptions and let it format them.

Images are uploaded through the existing `POST admin/upload` (Supabase Storage); an entity stores the returned public URL in a string column (`thumbnailUrl`, `photos: text[]`).

## Schema changes

There are no migrations. TypeORM `synchronize` runs whenever `NODE_ENV` isn't `production`, and the local `backend/.env` points at the production Supabase database. A local backend start therefore applies entity changes straight to production, before the code that uses them is deployed; production itself never synchronizes.

- Agents verify through unit tests and `build`, never by starting the backend (`start`, `start:dev`, `start:debug`) or by anything else that connects to the database.
- Prefer additive changes: a new nullable column, or one with a `default`, which the production code still running can ignore. Renaming or removing a column, or narrowing its type, destroys data and breaks production as soon as the backend starts locally: stop and ask the developer.
- The hand-over lists every entity change; the developer applies it to the database.

## Configuration

Read settings with `ConfigService.get<string>('NAME')`. A new variable gets a placeholder line in `backend/.env.example`, and the hand-over names it so the developer sets it locally and as a Fly.io secret.

## Done when

- every write route sits under `admin/` behind `JwtAuthGuard`;
- the module is registered in `app.module.ts`;
- every DTO field is decorated;
- every new variable is in `.env.example`, and every entity change is in the hand-over.
