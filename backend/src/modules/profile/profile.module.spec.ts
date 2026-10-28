import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request = require('supertest');
import { AllExceptionsFilter } from '../../common/filters/all-exceptions.filter';
import { Profile } from './profile.entity';
import { ProfileModule } from './profile.module';

describe('ProfileModule routes', () => {
  let app: INestApplication;
  let token: string;
  const repo = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const body = {
    heroTitle: 'Hello',
    heroSubtitle: 'World',
    bio: 'Bio',
    email: 'me@example.com',
    location: 'Paris',
    available: true,
  };
  const existing = { id: 1, ...body, heroTitle: 'Old' };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        ProfileModule,
      ],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: jest.fn((key: string) => ({ JWT_SECRET: 'test' })[key]),
      })
      .overrideProvider(getRepositoryToken(Profile))
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
    repo.create.mockImplementation((dto) => ({ ...dto }));
    repo.save.mockImplementation((entity) =>
      Promise.resolve({ id: 1, ...entity }),
    );
  });

  const auth = () => ({ Authorization: `Bearer ${token}` });

  const writes: [string, string, 'post' | 'patch', object][] = [
    ['POST', '/api/v1/admin/profile', 'post', body],
    ['PATCH', '/api/v1/admin/profile', 'patch', { location: 'Lyon' }],
  ];

  describe('admin routes without a token', () => {
    it.each(writes)(
      '%s %s answers 401 and never touches the repository',
      async (_m, url, verb, payload) => {
        await request(app.getHttpServer())[verb](url).send(payload).expect(401);

        expect(repo.save).not.toHaveBeenCalled();
        expect(repo.create).not.toHaveBeenCalled();
        expect(repo.find).not.toHaveBeenCalled();
      },
    );
  });

  describe('admin routes with a valid admin token', () => {
    it('POST /api/v1/admin/profile upserts the profile and answers 201', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/admin/profile')
        .set(auth())
        .send(body)
        .expect(201);

      expect(repo.find).toHaveBeenCalledWith({ take: 1 });
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, ...body }),
      );
    });

    it('PATCH /api/v1/admin/profile updates the profile and answers 200', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/admin/profile')
        .set(auth())
        .send({ location: 'Lyon' })
        .expect(200);

      expect(repo.find).toHaveBeenCalledWith({ take: 1 });
      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, location: 'Lyon' }),
      );
    });
  });

  describe('old write paths', () => {
    const oldPaths: [string, string, 'post' | 'patch', object][] = [
      ['POST', '/api/v1/profile', 'post', body],
      ['PATCH', '/api/v1/profile', 'patch', { location: 'Lyon' }],
    ];

    it.each(oldPaths)(
      '%s %s answers 404 even with a valid token',
      async (_m, url, verb, payload) => {
        await request(app.getHttpServer())
          [verb](url)
          .set(auth())
          .send(payload)
          .expect(404);

        expect(repo.save).not.toHaveBeenCalled();
      },
    );
  });

  describe('public reads', () => {
    it('GET /api/v1/profile answers 200 with the row, without a token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/profile')
        .expect(200);

      expect(res.body).toEqual(existing);
    });
  });
});
