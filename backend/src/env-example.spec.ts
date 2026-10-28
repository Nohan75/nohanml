import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { assertLocalDatabase } from './seed/seed';

const SRC_DIR = __dirname;
const ENV_EXAMPLE = join(__dirname, '..', '.env.example');

const CONFIG_READ =
  /\.get(?:OrThrow)?(?:<[^>]*>)?\(\s*['"]([A-Z][A-Z0-9_]*)['"]/g;
const PROCESS_ENV_READ =
  /process\.env(?:\.([A-Z][A-Z0-9_]*)|\[\s*['"]([A-Z][A-Z0-9_]*)['"]\s*\])/g;

const listSourceFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return listSourceFiles(path);
    return entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')
      ? [path]
      : [];
  });

const variablesRead = (): string[] => {
  const names = new Set<string>();
  for (const file of listSourceFiles(SRC_DIR)) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(CONFIG_READ)) names.add(match[1]);
    for (const match of source.matchAll(PROCESS_ENV_READ)) {
      names.add(match[1] ?? match[2]);
    }
  }
  return [...names].sort();
};

const envExample = (): Record<string, string> => {
  const values: Record<string, string> = {};
  for (const line of readFileSync(ENV_EXAMPLE, 'utf8').split(/\r?\n/)) {
    const match = /^([A-Z][A-Z0-9_]*)=(.*)$/.exec(line);
    if (match) values[match[1]] = match[2];
  }
  return values;
};

describe('backend/.env.example', () => {
  it('assigns exactly the variables the backend source reads', () => {
    const read = variablesRead();
    expect(read).toEqual(
      expect.arrayContaining(['DATABASE_URL', 'RESEND_API_KEY']),
    );
    expect(Object.keys(envExample()).sort()).toEqual(read);
  });

  it('gives every variable a non-empty value', () => {
    const empty = Object.entries(envExample())
      .filter(([, value]) => value.trim() === '')
      .map(([name]) => name);
    expect(Object.keys(envExample()).length).toBeGreaterThan(0);
    expect(empty).toEqual([]);
  });

  it('passes the seed local-database guard when copied unchanged', () => {
    const values = envExample();
    expect(() =>
      assertLocalDatabase({ get: (key) => values[key] }),
    ).not.toThrow();
  });
});
