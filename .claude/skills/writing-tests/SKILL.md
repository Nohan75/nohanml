---
name: writing-tests
description: How to write and run nohanml's unit tests (Jest in `backend/`, Jasmine and Karma in `frontend/`). Use when planning, writing, fixing or running a spec.
---

# Writing tests

The project started without tests, so the first specs set the pattern: follow these templates, which run as written.

Both apps:

- A spec sits next to the file it tests: `foo.service.ts` → `foo.service.spec.ts`.
- Tests are hermetic: the database, Supabase Storage, Resend and the HTTP API are always test doubles. A test that needs `backend/.env` is wrong.

## Backend: Jest

Run all: `yarn --cwd backend test`. Run some: `yarn --cwd backend test <path or name pattern>`.

Build the unit under test with `Test.createTestingModule` and replace each dependency:

```ts
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ExperiencesService } from './experiences.service';
import { Experience } from './experience.entity';

describe('ExperiencesService', () => {
  let service: ExperiencesService;
  const repo = { findOneBy: jest.fn(), find: jest.fn(), create: jest.fn(), save: jest.fn(), remove: jest.fn() };

  beforeEach(async () => {
    jest.resetAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [ExperiencesService, { provide: getRepositoryToken(Experience), useValue: repo }],
    }).compile();
    service = moduleRef.get(ExperiencesService);
  });

  it('throws NotFoundException for an unknown id', async () => {
    repo.findOneBy.mockResolvedValue(null);
    await expect(service.findOne(42)).rejects.toBeInstanceOf(NotFoundException);
  });
});
```

- `ConfigService`: `{ provide: ConfigService, useValue: { get: jest.fn((key: string) => env[key]) } }` with a plain `env` record.
- Services that build their client in the constructor (`ContactService` with Resend, `UploadService` with Supabase) need a module mock with a factory, declared above the imports; an automock leaves `emails` or `storage` undefined:

  ```ts
  const send = jest.fn();
  jest.mock('resend', () => ({
    Resend: jest.fn().mockImplementation(() => ({ emails: { send } })),
  }));

  const upload = jest.fn();
  const getPublicUrl = jest.fn();
  jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn(() => ({ storage: { from: jest.fn(() => ({ upload, getPublicUrl })) } })),
  }));
  ```

- DTO rules: `expect(await validate(plainToInstance(CreateXDto, body)))` with `validate` from `class-validator` and `plainToInstance` from `class-transformer`.
- Guards: call `canActivate` with a fake `ExecutionContext` whose `switchToHttp().getRequest()` returns `{ headers: { authorization: 'Bearer …' } }`, and a real `new JwtService({ secret: 'test' })` to sign tokens.
- Route-level tests (guard plus pipe plus controller over HTTP): see the next section.

### Route level: supertest

Guard, pipes and controller over HTTP, around the real feature module (see `backend/src/modules/projects/projects.module.spec.ts`). Repeat from `main.ts` the `api/v1` prefix, the `ValidationPipe` options and `AllExceptionsFilter`:

```ts
import request = require('supertest');   // no esModuleInterop: a default import is undefined
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AllExceptionsFilter } from '../../common/filters/all-exceptions.filter';
import { Project } from './project.entity';
import { ProjectsModule } from './projects.module';

let app: INestApplication;
const repo = { find: jest.fn(), findOneBy: jest.fn(), create: jest.fn(), save: jest.fn(), remove: jest.fn() };

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({
    imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }), ProjectsModule],
  })
    .overrideProvider(ConfigService)
    .useValue({ get: jest.fn((key: string) => ({ JWT_SECRET: 'test' })[key]) })
    .overrideProvider(getRepositoryToken(Project))
    .useValue(repo)
    .compile();
  app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  await app.init();
});

afterAll(() => app.close());

it('answers 401 without a token', () =>
  request(app.getHttpServer()).post('/api/v1/admin/projects').send({}).expect(401));

it('accepts an admin token', () => {
  repo.findOneBy.mockResolvedValue({ id: 1 });
  repo.remove.mockResolvedValue(undefined);
  const token = new JwtService({ secret: 'test' }).sign({ sub: 'admin' });
  return request(app.getHttpServer()).delete('/api/v1/admin/projects/1').set('Authorization', `Bearer ${token}`).expect(204);
});
```

- Override `ConfigService` and `getRepositoryToken(<Entity>)`, and set `ignoreEnvFile`: neither `backend/.env` nor a shell variable may reach the test, and the database is never opened.
- Inline the helpers in each spec: a non-spec file under `src/` is compiled into `dist`, and a `*.spec.ts` helper runs as an empty suite.

## Frontend: Jasmine and Karma

Run all: `yarn --cwd frontend test --watch=false --browsers=ChromeHeadless`. Run some: add `--include <spec path>` (repeatable). Without `--watch=false`, Karma never exits.

HTTP service, with `HttpTestingController`:

```ts
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ExperiencesService } from './experiences.service';
import { environment } from '../../../environments/environment';

describe('ExperiencesService', () => {
  let service: ExperiencesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ExperiencesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('creates through the admin route', () => {
    service.create({ title: 'x' }).subscribe();
    const req = http.expectOne(`${environment.apiUrl}/admin/experiences`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });
});
```

Store, with the service as a spy:

```ts
service = jasmine.createSpyObj<ExperiencesService>('ExperiencesService', ['getAll']);
TestBed.configureTestingModule({ providers: [{ provide: ExperiencesService, useValue: service }] });
service.getAll.and.returnValue(of([experience]));          // or throwError(() => new Error('x'))
const store = TestBed.inject(ExperiencesStore);
await store.loadExperiences();
expect(store.experiences().length).toBe(1);
```

Component: import it, set inputs through `componentRef`, then render:

```ts
TestBed.configureTestingModule({ imports: [ExperienceCardComponent], providers: [provideRouter([])] });
const fixture = TestBed.createComponent(ExperienceCardComponent);
fixture.componentRef.setInput('experience', experience);
fixture.detectChanges();
expect((fixture.nativeElement as HTMLElement).textContent).toContain('Dev Angular');
```

`provideRouter([])` is needed whenever the template uses `routerLink`.

### Admin screen: component with real store and service

For a screen under `features/admin/` (list plus form), test the component with its real root store and service over a fake HTTP layer (see `features/admin/projects/admin-projects.component.spec.ts`):

```ts
TestBed.configureTestingModule({
  imports: [AdminProjectsComponent],
  providers: [provideHttpClient(), provideHttpClientTesting()],   // no authInterceptor: the service specs cover the token
});
http = TestBed.inject(HttpTestingController);
fixture = TestBed.createComponent(AdminProjectsComponent);
fixture.detectChanges();                                          // ngOnInit loads the list
http.expectOne(`${environment.apiUrl}/projects`).flush([project]);
await fixture.whenStable();                                       // store load is a promise
fixture.detectChanges();                                          // OnPush: render after each step
```

- `afterEach(() => http.verify())`: it fails on any request left open, so a stray `PATCH` or reload `GET` is caught.
- Drive through the DOM: buttons by text or `aria-label`, `input.value = …` then `input.dispatchEvent(new Event('input'))`, `form.dispatchEvent(new Event('submit'))`, and `fixture.detectChanges()` after each step.
- Assert on the request: `http.expectOne(url)`, then `req.request.method` and `req.request.body`. After a successful write, flush the reload `GET` too.
- Failures: `req.flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' })`, then look for the `role="alert"` element.
- Deletes: `spyOn(window, 'confirm').and.returnValue(true)`.
- Fixtures: plain objects, not typed as the model, so a spec can use a field type the model does not allow yet.
