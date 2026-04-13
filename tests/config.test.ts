import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadConfig, saveConfig } from '../src/config.js';

describe('config store', () => {
  const tempRoot = mkdtempSync(join(tmpdir(), 'asana-oauth-cli-'));
  const configPath = join(tempRoot, 'credentials.json');

  afterEach(() => {
    rmSync(configPath, { force: true });
  });

  it('returns an empty object when config file does not exist', async () => {
    const config = await loadConfig(configPath);
    expect(config).toEqual({});
  });

  it('persists and reloads merged config values', async () => {
    await saveConfig(configPath, {
      clientId: 'client-1',
      redirectUri: 'urn:ietf:wg:oauth:2.0:oob',
    });

    await saveConfig(configPath, {
      token: {
        access_token: 'access-1',
        refresh_token: 'refresh-1',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: '2026-04-14T03:00:00.000Z',
      },
    });

    const config = await loadConfig(configPath);
    const mode = statSync(configPath).mode & 0o777;

    expect(config).toEqual({
      clientId: 'client-1',
      redirectUri: 'urn:ietf:wg:oauth:2.0:oob',
      token: {
        access_token: 'access-1',
        refresh_token: 'refresh-1',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: '2026-04-14T03:00:00.000Z',
      },
    });
    expect(mode).toBe(0o600);
  });
});
