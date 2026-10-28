import { join } from 'path';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

// `satisfies` keeps `type: 'postgres'`, so data-source.ts can spread these
// options into a DataSource.
export const typeOrmOptions = (config: {
  get: (key: string) => string | undefined;
}) =>
  ({
    type: 'postgres',
    url: config.get('DATABASE_URL'),
    autoLoadEntities: true,
    synchronize: false,
    migrations: [join(__dirname, '..', 'migrations', '*.{ts,js}')],
    migrationsRun: false,
    ssl:
      config.get('DATABASE_SSL') === 'false'
        ? false
        : { rejectUnauthorized: false },
    retryAttempts: 10,
    retryDelay: 3000,
  }) satisfies TypeOrmModuleOptions;
