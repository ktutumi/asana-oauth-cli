import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';

export type TokenData = {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in?: number;
  expires_at?: string;
};

export type StoredConfig = {
  clientId?: string;
  redirectUri?: string;
  token?: TokenData;
};

export function defaultConfigPath(): string {
  const configHome = process.env.XDG_CONFIG_HOME ?? join(homedir(), '.config');
  return join(configHome, 'asana-oauth-cli', 'credentials.json');
}

export async function loadConfig(configPath: string = defaultConfigPath()): Promise<StoredConfig> {
  try {
    const raw = await readFile(configPath, 'utf8');
    return JSON.parse(raw) as StoredConfig;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return {};
    }
    throw error;
  }
}

export async function saveConfig(configPath: string, patch: StoredConfig): Promise<StoredConfig> {
  const current = await loadConfig(configPath);
  const next: StoredConfig = {
    ...current,
    ...patch,
    token: patch.token ? { ...current.token, ...patch.token } : current.token,
  };

  await mkdir(dirname(configPath), { recursive: true });
  await writeFile(configPath, `${JSON.stringify(next, null, 2)}\n`, { encoding: 'utf8', mode: 0o600 });
  await chmod(configPath, 0o600);
  return next;
}
