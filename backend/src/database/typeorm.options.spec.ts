import { ConfigService } from '@nestjs/config';
import { typeOrmOptions } from './typeorm.options';

const configOf = (env: Record<string, string | undefined>) =>
  ({ get: jest.fn((key: string) => env[key]) }) as unknown as ConfigService;

const URL = 'postgresql://user:pass@db.example.com:5432/app';

const todays = (synchronize: boolean) => ({
  type: 'postgres',
  url: URL,
  autoLoadEntities: true,
  synchronize,
  ssl: { rejectUnauthorized: false },
  retryAttempts: 10,
  retryDelay: 3000,
});

describe('typeOrmOptions', () => {
  it('keeps today options in production when DATABASE_SSL is unset', () => {
    const options = typeOrmOptions(
      configOf({ DATABASE_URL: URL, NODE_ENV: 'production' }),
    );
    expect(options).toStrictEqual(todays(false));
  });

  it.each(['development', undefined])(
    'synchronizes the schema when NODE_ENV is %s and DATABASE_SSL is unset',
    (nodeEnv) => {
      const options = typeOrmOptions(
        configOf({ DATABASE_URL: URL, NODE_ENV: nodeEnv }),
      );
      expect(options).toStrictEqual(todays(true));
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
    expect(options).toStrictEqual({ ...todays(false), ssl: false });
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
      expect(options).toStrictEqual(todays(false));
    },
  );
});
