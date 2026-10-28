import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request = require('supertest');
import { AllExceptionsFilter } from '../../common/filters/all-exceptions.filter';
import { Skill } from './skill.entity';
import { SkillsModule } from './skills.module';

describe('SkillsModule routes', () => {
  let app: INestApplication;
  let token: string;
  const repo = {
    find: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };
  const body = { name: 'Angular', category: 'Frontend', order: 1 };
  const existing = { id: 1, name: 'Old', category: 'Old', order: 0 };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        SkillsModule,
      ],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: jest.fn((key: string) => ({ JWT_SECRET: 'test' })[key]),
      })
      .overrideProvider(getRepositoryToken(Skill))
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
    repo.find.mockResolvedValue([{ ...existing }]);
    repo.findOneBy.mockResolvedValue({ ...existing });
    repo.create.mockImplementation((dto) => ({ ...dto }));
    repo.save.mockImplementation((entity) =>
      Promise.resolve({ id: 1, ...entity }),
    );
    repo.remove.mockResolvedValue(undefined);
  });

  const auth = () => ({ Authorization: `Bearer ${token}` });

  const writes: [
    string,
    string,
    'post' | 'patch' | 'delete',
    object | undefined,
  ][] = [
    ['POST', '/api/v1/admin/skills', 'post', body],
    ['PATCH', '/api/v1/admin/skills/1', 'patch', { name: 'New' }],
    ['DELETE', '/api/v1/admin/skills/1', 'delete', undefined],
  ];

  describe('admin routes without a token', () => {
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

  describe('admin routes with a valid admin token', () => {
    it('POST /api/v1/admin/skills creates the skill and answers 201', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/skills')
        .set(auth())
        .send(body)
        .expect(201);

      expect(repo.create).toHaveBeenCalledWith(body);
      expect(repo.save).toHaveBeenCalledTimes(1);
    });

    it('PATCH /api/v1/admin/skills/1 updates the skill and answers 200', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/admin/skills/1')
        .set(auth())
        .send({ name: 'New' })
        .expect(200);

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, name: 'New' }),
      );
    });

    it('DELETE /api/v1/admin/skills/1 removes the skill and answers 204', async () => {
      await request(app.getHttpServer())
        .delete('/api/v1/admin/skills/1')
        .set(auth())
        .expect(204);

      expect(repo.remove).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1 }),
      );
    });
  });

  describe('old write paths', () => {
    const oldPaths: [string, string, 'post' | 'patch' | 'delete'][] = [
      ['POST', '/api/v1/skills', 'post'],
      ['PATCH', '/api/v1/skills/1', 'patch'],
      ['DELETE', '/api/v1/skills/1', 'delete'],
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
    it('GET /api/v1/skills answers 200 with the rows, without a token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/skills')
        .expect(200);

      expect(res.body).toEqual([existing]);
    });
  });
});
