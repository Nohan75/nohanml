import { ConfigService } from '@nestjs/config';
import { readdirSync } from 'fs';
import { join } from 'path';
import { ConnectionMetadataBuilder } from 'typeorm/connection/ConnectionMetadataBuilder';
import { DataSource } from 'typeorm';
import { typeOrmOptions } from './typeorm.options';

const configOf = (env: Record<string, string | undefined>) =>
  ({ get: jest.fn((key: string) => env[key]) }) as unknown as ConfigService;

const URL = 'postgresql://user:pass@db.example.com:5432/app';

const MIGRATIONS_DIR = join(__dirname, '..', 'migrations');
const MIGRATIONS_GLOB = join(MIGRATIONS_DIR, '*.{ts,js}');

const todays = () => ({
  type: 'postgres',
  url: URL,
  autoLoadEntities: true,
  synchronize: false,
  migrations: [MIGRATIONS_GLOB],
  migrationsRun: false,
  ssl: { rejectUnauthorized: false },
  retryAttempts: 10,
  retryDelay: 3000,
});

describe('typeOrmOptions', () => {
  it.each(['production', 'development', undefined])(
    'never synchronizes, registers the migrations without running them when NODE_ENV is %s',
    (nodeEnv) => {
      const options = typeOrmOptions(
        configOf({ DATABASE_URL: URL, NODE_ENV: nodeEnv }),
      );
      expect(options).toStrictEqual(todays());
    },
  );

  it('turns SSL off and changes nothing else when DATABASE_SSL is false', () => {
    const options = typeOrmOptions(
      configOf({
        DATABASE_URL: URL,
        NODE_ENV: 'production',
        DATABASE_SSL: 'false',
      }),
    );
    expect(options).toStrictEqual({ ...todays(), ssl: false });
  });

  it.each(['true', '', 'no', 'FALSE'])(
    'keeps SSL on when DATABASE_SSL is %p',
    (value) => {
      const options = typeOrmOptions(
        configOf({
          DATABASE_URL: URL,
          NODE_ENV: 'production',
          DATABASE_SSL: value,
        }),
      );
      expect(options).toStrictEqual(todays());
    },
  );

  it('registers one migration class per file of src/migrations, at least one', async () => {
    const files = readdirSync(MIGRATIONS_DIR).filter((name) =>
      /^\d+-.+\.ts$/.test(name),
    );
    const { migrations } = typeOrmOptions(configOf({ DATABASE_URL: URL }));
    const builder = new ConnectionMetadataBuilder(
      new DataSource({ type: 'postgres' }),
    );

    const built = await builder.buildMigrations(migrations as string[]);

    expect(files.length).toBeGreaterThan(0);
    expect(built).toHaveLength(files.length);
  });
});
