import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { loadEnvFile } from './load-env';

describe('loadEnvFile', () => {
  let dir: string;
  let file: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'load-env-'));
    file = join(dir, '.env');
  });

  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("copies the file's variables into the target env", () => {
    writeFileSync(file, 'DATABASE_URL=postgresql://a/b\nDATABASE_SSL=false\n');
    const env: Record<string, string | undefined> = {};

    loadEnvFile(file, env);

    expect(env).toEqual({
      DATABASE_URL: 'postgresql://a/b',
      DATABASE_SSL: 'false',
    });
  });

  it('keeps a variable already set in the target env', () => {
    writeFileSync(file, 'DATABASE_URL=from-file\nDATABASE_SSL=false\n');
    const env: Record<string, string | undefined> = {
      DATABASE_URL: 'from-shell',
    };

    loadEnvFile(file, env);

    expect(env).toEqual({
      DATABASE_URL: 'from-shell',
      DATABASE_SSL: 'false',
    });
  });

  it('ignores a missing file without throwing or changing the env', () => {
    const env: Record<string, string | undefined> = { KEEP: 'me' };

    expect(() => loadEnvFile(join(dir, 'absent.env'), env)).not.toThrow();
    expect(env).toEqual({ KEEP: 'me' });
  });
});
