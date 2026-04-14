import { afterEach, describe, expect, it, vi } from 'vitest';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runCli } from '../src/cli.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('cli', () => {
  it('prints the authorization URL for auth url', async () => {
    const stdout: string[] = [];

    await runCli(['auth', 'url', '--client-id', 'client-1', '--state', 'state-1'], {
      stdout: (line) => stdout.push(line),
      stderr: vi.fn(),
      exit: (code) => {
        throw new Error(`unexpected exit ${code}`);
      },
    });

    expect(stdout[0]).toContain('https://app.asana.com/-/oauth_authorize?');
    expect(stdout[0]).toContain('client_id=client-1');
    expect(stdout[0]).toContain('state=state-1');
  });

  it('completes auth login through localhost callback and saves the token', async () => {
    const stdout: string[] = [];
    const configDir = mkdtempSync(join(tmpdir(), 'asana-oauth-cli-cli-'));
    const configPath = join(configDir, 'credentials.json');
    const originalFetch = fetch;

    vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === 'https://app.asana.com/-/oauth_token') {
        return {
          ok: true,
          json: async () => ({
            access_token: 'access-1',
            refresh_token: 'refresh-1',
            token_type: 'bearer',
            expires_in: 3600,
          }),
        } as Response;
      }
      return originalFetch(input, init);
    });

    const cliPromise = runCli([
      '--config',
      configPath,
      'auth',
      'login',
      '--client-id',
      'client-1',
      '--client-secret',
      'secret-1',
      '--redirect-uri',
      'http://127.0.0.1:0/callback',
      '--state',
      'state-1',
      '--listen-timeout-ms',
      '2000',
    ], {
      stdout: (line) => stdout.push(line),
      stderr: vi.fn(),
      exit: (code) => {
        throw new Error(`unexpected exit ${code}`);
      },
    });

    await vi.waitFor(() => {
      expect(stdout.some((line) => line.includes('Open this URL in your browser:'))).toBe(true);
    });

    const urlLine = stdout.find((line) => line.startsWith('Open this URL in your browser: '));
    const authUrl = new URL(urlLine!.replace('Open this URL in your browser: ', ''));

    const callback = new URL(authUrl.searchParams.get('redirect_uri')!);
    callback.searchParams.set('code', 'code-1');
    callback.searchParams.set('state', 'state-1');

    const callbackResponse = await fetch(callback);
    expect(callbackResponse.status).toBe(200);

    await cliPromise;

    const saved = JSON.parse(readFileSync(configPath, 'utf8')) as {
      clientId: string;
      redirectUri: string;
      token: { access_token: string; refresh_token: string; token_type: string; expires_at: string };
    };

    expect(saved.clientId).toBe('client-1');
    expect('clientSecret' in saved).toBe(false);
    expect(saved.redirectUri).toMatch(/^http:\/\/127\.0\.0\.1:\d+\/callback$/);
    expect(saved.token.access_token).toBe('access-1');
    expect(saved.token.refresh_token).toBe('refresh-1');
    expect(saved.token.token_type).toBe('bearer');
    expect(saved.token.expires_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(urlLine).toContain('scope=users%3Aread%20workspaces%3Aread%20projects%3Aread');
    expect(stdout.some((line) => line.includes('"access_token": "***"'))).toBe(true);
  });

  it('fails auth login when the callback state is missing', async () => {
    const stdout: string[] = [];
    const stderr: string[] = [];
    const configDir = mkdtempSync(join(tmpdir(), 'asana-oauth-cli-cli-'));
    const configPath = join(configDir, 'credentials.json');

    const cliPromise = runCli([
      '--config',
      configPath,
      'auth',
      'login',
      '--client-id',
      'client-1',
      '--client-secret',
      'secret-1',
      '--redirect-uri',
      'http://127.0.0.1:0/callback',
      '--state',
      'state-1',
      '--listen-timeout-ms',
      '2000',
    ], {
      stdout: (line) => stdout.push(line),
      stderr: (line) => stderr.push(line),
      exit: () => {
        throw new Error('exit 1');
      },
    }).catch((error) => error);

    await vi.waitFor(() => {
      expect(stdout.some((line) => line.includes('Open this URL in your browser:'))).toBe(true);
    });

    const urlLine = stdout.find((line) => line.startsWith('Open this URL in your browser: '));
    const authUrl = new URL(urlLine!.replace('Open this URL in your browser: ', ''));
    const callback = new URL(authUrl.searchParams.get('redirect_uri')!);
    callback.searchParams.set('code', 'code-1');

    const callbackResponse = await fetch(callback);
    expect(callbackResponse.status).toBe(200);

    const result = await cliPromise;
    expect(result).toBeInstanceOf(Error);
    expect(stderr).toContain('OAuth state mismatch');
  });

  it('lists projects for a workspace with projects list', async () => {
    const stdout: string[] = [];
    const configDir = mkdtempSync(join(tmpdir(), 'asana-oauth-cli-cli-'));
    const configPath = join(configDir, 'credentials.json');

    writeFileSync(configPath, JSON.stringify({
      clientId: 'client-1',
      redirectUri: 'http://127.0.0.1:18787/callback',
      token: {
        access_token: 'access-1',
        refresh_token: 'refresh-1',
        token_type: 'bearer',
      },
    }));

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ gid: '10', name: 'Roadmap' }], next_page: null }),
    }));

    await runCli(['--config', configPath, 'projects', 'list', '--workspace', 'workspace-1'], {
      stdout: (line) => stdout.push(line),
      stderr: vi.fn(),
      exit: (code) => {
        throw new Error(`unexpected exit ${code}`);
      },
    });

    expect(stdout[0]).toContain('Roadmap');
  });

  it('supports project as an alias for projects', async () => {
    const stdout: string[] = [];
    const configDir = mkdtempSync(join(tmpdir(), 'asana-oauth-cli-cli-'));
    const configPath = join(configDir, 'credentials.json');

    writeFileSync(configPath, JSON.stringify({
      clientId: 'client-1',
      redirectUri: 'http://127.0.0.1:18787/callback',
      token: {
        access_token: 'access-1',
        refresh_token: 'refresh-1',
        token_type: 'bearer',
      },
    }));

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ gid: '10', name: 'Roadmap' }], next_page: null }),
    }));

    await runCli(['--config', configPath, 'project', 'list', '--workspace', 'workspace-1'], {
      stdout: (line) => stdout.push(line),
      stderr: vi.fn(),
      exit: (code) => {
        throw new Error(`unexpected exit ${code}`);
      },
    });

    expect(stdout[0]).toContain('Roadmap');
  });
});