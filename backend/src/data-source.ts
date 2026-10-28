import { join, resolve } from 'path';
import { DataSource } from 'typeorm';
import { loadEnvFile } from './database/load-env';
import { typeOrmOptions } from './database/typeorm.options';

// Data source of the TypeORM CLI (migration:generate|run|revert|show), from
// src through ts-node locally and from dist with plain node in production.
loadEnvFile(resolve(process.cwd(), '.env'));

export const dataSource = new DataSource({
  ...typeOrmOptions({ get: (key) => process.env[key] }),
  entities: [join(__dirname, '**', '*.entity.{ts,js}')],
});
