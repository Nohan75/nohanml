import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { QueryFailedError } from 'typeorm';
import { Experience } from '../modules/experiences/experience.entity';
import { CreateExperienceDto } from '../modules/experiences/dto/experience.dto';
import { Profile } from '../modules/profile/profile.entity';
import { CreateProfileDto } from '../modules/profile/dto/profile.dto';
import { Project } from '../modules/projects/project.entity';
import { CreateProjectDto } from '../modules/projects/dto/project.dto';
import { Skill } from '../modules/skills/skill.entity';
import { CreateSkillDto } from '../modules/skills/dto/skill.dto';
import {
  SAMPLE_EXPERIENCE,
  SAMPLE_PROFILE,
  SAMPLE_PROJECT,
  SAMPLE_SKILL,
  assertLocalDatabase,
  run,
  seed,
} from './seed';

jest.mock('@nestjs/core', () => ({
  ...jest.requireActual('@nestjs/core'),
  NestFactory: { createApplicationContext: jest.fn() },
}));

const tables = [
  { name: 'profile', entity: Profile, sample: SAMPLE_PROFILE },
  { name: 'project', entity: Project, sample: SAMPLE_PROJECT },
  { name: 'skill', entity: Skill, sample: SAMPLE_SKILL },
  { name: 'experience', entity: Experience, sample: SAMPLE_EXPERIENCE },
];

// Repositories are looked up with app.get(getRepositoryToken(Entity)).
const makeRepos = (counts: Record<string, number>) => {
  const byName = new Map<string, { count: jest.Mock; save: jest.Mock }>();
  const byToken = new Map<unknown, unknown>();
  for (const { name, entity } of tables) {
    const repo = {
      count: jest.fn().mockResolvedValue(counts[name] ?? 0),
      save: jest.fn().mockResolvedValue({}),
    };
    byName.set(name, repo);
    byToken.set(getRepositoryToken(entity), repo);
  }
  const app = { get: jest.fn((token: unknown) => byToken.get(token)) };
  return { app, repoOf: (name: string) => byName.get(name)! };
};

describe('seed', () => {
  it('writes exactly one sample row into each empty table', async () => {
    const { app, repoOf } = makeRepos({});
    await seed(app as never);
    for (const { name, sample } of tables) {
      expect(repoOf(name).save).toHaveBeenCalledTimes(1);
      expect(repoOf(name).save).toHaveBeenCalledWith(sample);
    }
  });

  it('writes nothing when every table already holds rows', async () => {
    const { app, repoOf } = makeRepos({
      profile: 1,
      project: 2,
      skill: 3,
      experience: 4,
    });
    await seed(app as never);
    for (const { name } of tables) {
      expect(repoOf(name).count).toHaveBeenCalled();
      expect(repoOf(name).save).not.toHaveBeenCalled();
    }
  });

  it.each(tables.map((t) => t.name))(
    'leaves the %s table alone when only it holds rows and seeds the other three',
    async (filled) => {
      const { app, repoOf } = makeRepos({ [filled]: 5 });
      await seed(app as never);
      for (const { name } of tables) {
        expect(repoOf(name).save).toHaveBeenCalledTimes(
          name === filled ? 0 : 1,
        );
      }
    },
  );

  it('rejects with the same error when a write fails', async () => {
    const { app, repoOf } = makeRepos({});
    const failure = new Error('insert failed');
    repoOf('skill').save.mockRejectedValue(failure);
    await expect(seed(app as never)).rejects.toBe(failure);
  });
});

describe('sample rows', () => {
  it.each([
    ['profile', CreateProfileDto, SAMPLE_PROFILE],
    ['project', CreateProjectDto, SAMPLE_PROJECT],
    ['skill', CreateSkillDto, SAMPLE_SKILL],
    ['experience', CreateExperienceDto, SAMPLE_EXPERIENCE],
  ] as const)(
    'the %s sample passes its Create DTO',
    async (_name, dto, sample) => {
      const instance = plainToInstance(dto as never, sample) as object;
      expect(await validate(instance)).toEqual([]);
    },
  );
});

describe('assertLocalDatabase', () => {
  const configOf = (env: Record<string, string | undefined>) => ({
    get: (key: string) => env[key],
  });
  const local = 'postgresql://postgres:postgres@localhost:5432/nohanml';

  it.each(['localhost', '127.0.0.1'])('accepts SSL off on host %s', (host) => {
    const url = `postgresql://postgres:postgres@${host}:5432/nohanml`;
    expect(() =>
      assertLocalDatabase(
        configOf({ DATABASE_SSL: 'false', DATABASE_URL: url }),
      ),
    ).not.toThrow();
  });

  it.each([undefined, 'true', 'FALSE', ''])(
    'refuses when DATABASE_SSL is %p',
    (ssl) => {
      expect(() =>
        assertLocalDatabase(
          configOf({ DATABASE_SSL: ssl, DATABASE_URL: local }),
        ),
      ).toThrow();
    },
  );

  it.each([
    'postgresql://u:p@db.tkipivttkaemxubvacon.supabase.co:5432/postgres',
    'postgresql://u:p@localhost.evil.com:5432/nohanml',
    'postgresql://u:p@example.com:5432/localhost',
  ])('refuses the non-local URL %s', (url) => {
    expect(() =>
      assertLocalDatabase(
        configOf({ DATABASE_SSL: 'false', DATABASE_URL: url }),
      ),
    ).toThrow();
  });

  it('refuses when DATABASE_URL is missing', () => {
    expect(() =>
      assertLocalDatabase(configOf({ DATABASE_SSL: 'false' })),
    ).toThrow();
  });
});

describe('run', () => {
  const createContext = NestFactory.createApplicationContext as jest.Mock;
  const saved = {
    exitCode: process.exitCode,
    ssl: process.env.DATABASE_SSL,
    url: process.env.DATABASE_URL,
  };
  let errorSpy: jest.SpyInstance;
  let close: jest.Mock;
  let repos: ReturnType<typeof makeRepos>;

  const restore = (
    key: 'DATABASE_SSL' | 'DATABASE_URL',
    value: string | undefined,
  ) => {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  };

  beforeEach(() => {
    createContext.mockReset();
    process.exitCode = undefined;
    process.env.DATABASE_SSL = 'false';
    process.env.DATABASE_URL =
      'postgresql://postgres:postgres@localhost:5432/nohanml';
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    close = jest.fn().mockResolvedValue(undefined);
    repos = makeRepos({});
    createContext.mockResolvedValue({ get: repos.app.get, close });
  });

  afterEach(() => errorSpy.mockRestore());

  afterAll(() => {
    process.exitCode = saved.exitCode;
    restore('DATABASE_SSL', saved.ssl);
    restore('DATABASE_URL', saved.url);
  });

  it('seeds, closes the connection and leaves the exit code alone on success', async () => {
    await run();
    expect(repos.repoOf('profile').save).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
    expect(process.exitCode).toBeUndefined();
  });

  it('closes the connection, prints the error and sets exit code 1 when the seed fails', async () => {
    const failure = new Error('insert failed');
    repos.repoOf('project').save.mockRejectedValue(failure);
    await run();
    expect(close).toHaveBeenCalledTimes(1);
    expect(process.exitCode).toBe(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.anything(), failure);
  });

  it('names yarn --cwd backend migration:run, sets exit code 1 and closes the connection when the schema was never migrated', async () => {
    const missingRelation = Object.assign(
      new Error('relation "profile" does not exist'),
      { code: '42P01' },
    );
    repos
      .repoOf('profile')
      .count.mockRejectedValue(
        new QueryFailedError(
          'SELECT COUNT(1) FROM "profile"',
          [],
          missingRelation,
        ),
      );
    await run();
    const printed = errorSpy.mock.calls
      .flat()
      .filter((arg): arg is string => typeof arg === 'string')
      .join('\n');
    expect(printed).toContain('yarn --cwd backend migration:run');
    expect(process.exitCode).toBe(1);
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('opens no connection and sets exit code 1 when SSL is not off', async () => {
    process.env.DATABASE_SSL = 'true';
    await run();
    expect(createContext).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });

  it('opens no connection and sets exit code 1 when the URL host is not local', async () => {
    process.env.DATABASE_URL =
      'postgresql://u:p@db.tkipivttkaemxubvacon.supabase.co:5432/postgres';
    await run();
    expect(createContext).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });
});
