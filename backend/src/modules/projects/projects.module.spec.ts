import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request = require('supertest');
import { AllExceptionsFilter } from '../../common/filters/all-exceptions.filter';
import { Project } from './project.entity';
import { ProjectsModule } from './projects.module';

describe('ProjectsModule admin routes', () => {
  let app: INestApplication;
  let token: string;
  const repo = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };
  const body = {
    title: 'Portfolio',
    description: 'My site',
    stack: ['Angular'],
  };
  const existing = { id: 1, title: 'Old', description: 'Old', stack: [] };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        ProjectsModule,
      ],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: jest.fn((key: string) => ({ JWT_SECRET: 'test' })[key]),
      })
      .overrideProvider(getRepositoryToken(Project))
      .useValue(repo)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    await app.init();

    token = new JwtService({ secret: 'test' }).sign({ sub: 'admin' });
  });

  afterAll(() => app.close());

  beforeEach(() => {
    jest.resetAllMocks();
    repo.findOneBy.mockResolvedValue({ ...existing });
    repo.create.mockImplementation((dto) => ({ ...dto }));
    repo.save.mockImplementation((entity) =>
      Promise.resolve({ id: 1, ...entity }),
    );
    repo.remove.mockResolvedValue(undefined);
  });

  const writes: [
    string,
    string,
    'post' | 'patch' | 'delete',
    object | undefined,
  ][] = [
    ['POST', '/api/v1/admin/projects', 'post', body],
    ['PATCH', '/api/v1/admin/projects/1', 'patch', { title: 'New' }],
    ['DELETE', '/api/v1/admin/projects/1', 'delete', undefined],
  ];

  describe('without a token', () => {
    it.each(writes)(
      '%s %s answers 401 and never touches the repository',
      async (_m, url, verb, payload) => {
        await request(app.getHttpServer())[verb](url).send(payload).expect(401);

        expect(repo.save).not.toHaveBeenCalled();
        expect(repo.remove).not.toHaveBeenCalled();
        expect(repo.create).not.toHaveBeenCalled();
        expect(repo.findOneBy).not.toHaveBeenCalled();
      },
    );
  });

  describe('with a valid admin token', () => {
    const auth = () => ({ Authorization: `Bearer ${token}` });

    it('POST /api/v1/admin/projects creates the project and answers 201', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/projects')
        .set(auth())
        .send(body)
        .expect(201);

      expect(repo.create).toHaveBeenCalledWith(body);
      expect(repo.save).toHaveBeenCalledTimes(1);
    });

    it('PATCH /api/v1/admin/projects/1 updates the project and answers 200', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/admin/projects/1')
        .set(auth())
        .send({ title: 'New' })
        .expect(200);

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, title: 'New' }),
      );
    });

    it('PATCH /api/v1/admin/projects/1 with null URLs answers 200 and saves nulls', async () => {
      const urls = { githubUrl: null, liveUrl: null, imageUrl: null };

      await request(app.getHttpServer())
        .patch('/api/v1/admin/projects/1')
        .set(auth())
        .send(urls)
        .expect(200);

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, ...urls }),
      );
    });

    it('POST /api/v1/admin/projects with null URLs answers 201 and saves nulls', async () => {
      const urls = { githubUrl: null, liveUrl: null, imageUrl: null };

      await request(app.getHttpServer())
        .post('/api/v1/admin/projects')
        .set(auth())
        .send({ ...body, ...urls })
        .expect(201);

      expect(repo.save).toHaveBeenCalledWith(expect.objectContaining(urls));
    });

    it('DELETE /api/v1/admin/projects/1 removes the project and answers 204', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/admin/projects/1')
        .set(auth())
        .expect(204);

      expect(repo.remove).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1 }),
      );
    });
  });

  describe('with an invalid credential', () => {
    it('POST /api/v1/admin/projects with a token signed by another secret answers 401', async () => {
      const forged = new JwtService({ secret: 'other' }).sign({ sub: 'admin' });

      await request(app.getHttpServer())
        .post('/api/v1/admin/projects')
        .set({ Authorization: `Bearer ${forged}` })
        .send(body)
        .expect(401);

      expect(repo.save).not.toHaveBeenCalled();
    });

    it('POST /api/v1/admin/projects with a Basic authorization answers 401', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/projects')
        .set({ Authorization: 'Basic YWRtaW46c2VjcmV0' })
        .send(body)
        .expect(401);

      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('old write paths', () => {
    const auth = () => ({ Authorization: `Bearer ${token}` });
    const oldPaths: [string, string, 'post' | 'patch' | 'delete'][] = [
      ['POST', '/api/v1/projects', 'post'],
      ['PATCH', '/api/v1/projects/1', 'patch'],
      ['DELETE', '/api/v1/projects/1', 'delete'],
    ];

    it.each(oldPaths)(
      '%s %s answers 404 even with a valid token',
      async (_m, url, verb) => {
        await request(app.getHttpServer())
          [verb](url)
          .set(auth())
          .send(verb === 'delete' ? undefined : body)
          .expect(404);

        expect(repo.save).not.toHaveBeenCalled();
        expect(repo.remove).not.toHaveBeenCalled();
      },
    );
  });

  describe('public reads', () => {
    it('GET /api/v1/projects answers 200 with the rows, without a token', async () => {
      repo.find.mockResolvedValue([{ ...existing }]);

      const res = await request(app.getHttpServer())
        .get('/api/v1/projects')
        .expect(200);

      expect(res.body).toEqual([existing]);
    });

    it('GET /api/v1/projects/1 answers 200 with the row, without a token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/projects/1')
        .expect(200);

      expect(res.body).toEqual(existing);
    });
  });
});
