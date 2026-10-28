import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeOrmOptions = (config: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  url: config.get<string>('DATABASE_URL'),
  autoLoadEntities: true,
  synchronize: config.get<string>('NODE_ENV') !== 'production',
  ssl:
    config.get<string>('DATABASE_SSL') === 'false'
      ? false
      : { rejectUnauthorized: false },
  retryAttempts: 10,
  retryDelay: 3000,
});
