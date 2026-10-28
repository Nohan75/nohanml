import { existsSync, readFileSync } from 'fs';
import { parseEnv } from 'util';

// Copies the variables of a .env file into `env`, keeping any already set there
// (shell or Fly secret wins); a missing file changes nothing.
export const loadEnvFile = (
  filePath: string,
  env: Record<string, string | undefined> = process.env,
): void => {
  if (!existsSync(filePath)) return;
  const variables = parseEnv(readFileSync(filePath, 'utf8'));
  for (const [key, value] of Object.entries(variables)) {
    if (env[key] === undefined) env[key] = value;
  }
};
