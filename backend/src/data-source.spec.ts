import { readdirSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { ConnectionMetadataBuilder } from 'typeorm/connection/ConnectionMetadataBuilder';
import { typeOrmOptions } from './database/typeorm.options';

type Env = Record<string, string | undefined>;
type Loaded = {
  exports: Record<string, unknown>;
  dataSource: DataSource;
  loader: jest.Mock;
  isDataSource: (value: unknown) => boolean;
};

jest.mock('./database/load-env', () => ({ loadEnvFile: jest.fn() }));

const URL = 'postgresql://user:pass@db.example.com:5432/app';

// Imports data-source.ts in an isolated registry with `env` as process.env,
// then restores process.env. `fromLoader` simulates what the loader sets.
const importDataSource = (env: Env, fromLoader: Env = {}): Loaded => {
  const saved = { ...process.env };
  for (const key of Object.keys(process.env)) delete process.env[key];
  for (const [key, value] of Object.entries(env)) {
    if (value !== undefined) process.env[key] = value;
  }
  try {
    let loaded!: Loaded;
    /* eslint-disable @typescript-eslint/no-var-requires */
    jest.isolateModules(() => {
      const loader = (
        require('./database/load-env') as { loadEnvFile: jest.Mock }
      ).loadEnvFile;
      loader.mockImplementation(() => {
        for (const [key, value] of Object.entries(fromLoader)) {
          if (value !== undefined) process.env[key] = value;
        }
      });
      const exports = require('./data-source') as Record<string, unknown>;
      const { DataSource: IsolatedDataSource } = require('typeorm') as {
        DataSource: typeof DataSource;
      };
      const isDataSource = (value: unknown) =>
        value instanceof IsolatedDataSource;
      const instances = Object.values(exports).filter(isDataSource);
      loaded = {
        exports,
        dataSource: instances[0] as DataSource,
        loader,
        isDataSource,
      };
    });
    /* eslint-enable @typescript-eslint/no-var-requires */
    return loaded;
  } finally {
    for (const key of Object.keys(process.env)) delete process.env[key];
    Object.assign(process.env, saved);
  }
};

const listEntityFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return listEntityFiles(path);
    return entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')
      ? [path]
      : [];
  });

const declaredTables = (): string[] => {
  const names = new Set<string>();
  for (const file of listEntityFiles(__dirname)) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/@Entity\(\s*['"]([^'"]+)['"]/g)) {
      names.add(match[1]);
    }
  }
  return [...names].sort();
};

describe('data-source', () => {
  beforeEach(() => jest.clearAllMocks());

  it.each(['false', undefined])(
    'uses the app connection options when DATABASE_SSL is %s',
    (ssl) => {
      const env = {
        DATABASE_URL: URL,
        DATABASE_SSL: ssl,
        NODE_ENV: 'development',
      };
      const { dataSource } = importDataSource(env);
      const app = typeOrmOptions({
        get: (key: string) => env[key as keyof typeof env],
      } as unknown as ConfigService) as Record<string, unknown>;

      expect(dataSource.options).toMatchObject({
        type: app.type,
        url: app.url,
        ssl: app.ssl,
        synchronize: false,
        migrations: app.migrations,
      });
      expect(dataSource.options.migrationsRun).not.toBe(true);
    },
  );

  it('resolves its entities to exactly the tables declared with @Entity in src', async () => {
    const { dataSource } = importDataSource({ DATABASE_URL: URL });
    const builder = new ConnectionMetadataBuilder(
      new DataSource({ type: 'postgres' }),
    );

    const metadatas = await builder.buildEntityMetadatas(
      dataSource.options.entities as string[],
    );

    expect(declaredTables().length).toBeGreaterThan(0);
    expect(metadatas.map((m) => m.tableName).sort()).toEqual(declaredTables());
  });

  it('loads .env before reading any variable', () => {
    const { dataSource, loader } = importDataSource(
      {},
      { DATABASE_URL: 'postgresql://loaded@localhost:5432/from_env_file' },
    );

    expect(loader).toHaveBeenCalledTimes(1);
    expect(resolve(loader.mock.calls[0][0] as string)).toBe(
      resolve(process.cwd(), '.env'),
    );
    expect(dataSource.options).toMatchObject({
      url: 'postgresql://loaded@localhost:5432/from_env_file',
    });
  });

  it('exports exactly one DataSource', () => {
    const { exports, isDataSource } = importDataSource({ DATABASE_URL: URL });

    expect(Object.values(exports).filter(isDataSource)).toHaveLength(1);
  });
});
