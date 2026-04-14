#!/usr/bin/env node

import { Command } from 'commander';
import { exchangeCodeForToken, fetchMe, listProjects, listWorkspaces, refreshAccessToken } from './asana-api.js';
import { defaultConfigPath, loadConfig, saveConfig } from './config.js';
import { buildAuthorizationUrl, defaultLocalhostRedirectUri, defaultScopes, generateState } from './oauth.js';
import { waitForOAuthCallback } from './oauth-callback.js';
import type { TokenData } from './config.js';

export type CliIo = {
  stdout: (line: string) => void;
  stderr: (line: string) => void;
  exit: (code: number) => never;
};

const defaultIo: CliIo = {
  stdout: (line) => console.log(line),
  stderr: (line) => console.error(line),
  exit: (code) => process.exit(code),
};

export async function runCli(argv: string[], io: CliIo = defaultIo): Promise<void> {
  const program = new Command();
  program.name('asana-oauth');
  program.description('Lightweight Asana OAuth CLI');
  program.showHelpAfterError();

  program
    .option('--config <path>', 'config path', defaultConfigPath());

  const auth = program.command('auth').description('OAuth helpers');

  auth
    .command('url')
    .description('print an authorization URL')
    .requiredOption('--client-id <id>', 'Asana OAuth client ID')
    .option('--redirect-uri <uri>', 'OAuth redirect URI', 'urn:ietf:wg:oauth:2.0:oob')
    .option('--scope <scope...>', 'OAuth scopes', defaultScopes)
    .option('--state <state>', 'explicit state token')
    .action((options) => {
      const url = buildAuthorizationUrl({
        clientId: options.clientId,
        redirectUri: options.redirectUri,
        scopes: options.scope,
        state: options.state ?? generateState(),
      });
      io.stdout(url);
    });

  auth
    .command('exchange')
    .description('exchange an authorization code for tokens')
    .requiredOption('--client-id <id>', 'Asana OAuth client ID')
    .requiredOption('--client-secret <secret>', 'Asana OAuth client secret')
    .requiredOption('--code <code>', 'Authorization code')
    .option('--redirect-uri <uri>', 'OAuth redirect URI', 'urn:ietf:wg:oauth:2.0:oob')
    .action(async (options) => {
      const token = await exchangeCodeForToken({
        clientId: options.clientId,
        clientSecret: options.clientSecret,
        code: options.code,
        redirectUri: options.redirectUri,
      });
      const configPath = program.opts().config as string;
      await saveConfig(configPath, {
        clientId: options.clientId,
        redirectUri: options.redirectUri,
        token,
      });
      io.stdout(JSON.stringify(redactToken(token), null, 2));
    });

  auth
    .command('login')
    .description('start a localhost callback server and complete OAuth automatically')
    .requiredOption('--client-id <id>', 'Asana OAuth client ID')
    .requiredOption('--client-secret <secret>', 'Asana OAuth client secret')
    .option('--redirect-uri <uri>', 'OAuth redirect URI', defaultLocalhostRedirectUri)
    .option('--scope <scope...>', 'OAuth scopes', defaultScopes)
    .option('--state <state>', 'explicit state token')
    .option('--listen-timeout-ms <ms>', 'listen timeout in milliseconds', '120000')
    .action(async (options) => {
      const redirectUrl = new URL(options.redirectUri);
      if (redirectUrl.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(redirectUrl.hostname)) {
        throw new Error('auth login requires an http://localhost or http://127.0.0.1 redirect URI');
      }

      const state = options.state ?? generateState();
      const listener = await waitForOAuthCallback({
        hostname: redirectUrl.hostname,
        port: Number(redirectUrl.port || 80),
        callbackPath: redirectUrl.pathname || '/',
        timeoutMs: Number(options.listenTimeoutMs),
      });

      const authUrl = buildAuthorizationUrl({
        clientId: options.clientId,
        redirectUri: listener.callbackUrl,
        scopes: options.scope,
        state,
      });
      io.stdout(`Open this URL in your browser: ${authUrl}`);

      const callback = await listener.result;
      if (callback.state !== state) {
        throw new Error('OAuth state mismatch');
      }

      const token = await exchangeCodeForToken({
        clientId: options.clientId,
        clientSecret: options.clientSecret,
        code: callback.code,
        redirectUri: listener.callbackUrl,
      });
      const configPath = program.opts().config as string;
      await saveConfig(configPath, {
        clientId: options.clientId,
        redirectUri: listener.callbackUrl,
        token,
      });
      io.stdout(JSON.stringify(redactToken(token), null, 2));
    });

  auth
    .command('refresh')
    .description('refresh the saved token')
    .requiredOption('--client-secret <secret>', 'Asana OAuth client secret')
    .action(async (options) => {
      const configPath = program.opts().config as string;
      const config = await loadConfig(configPath);
      if (!config.clientId || !config.redirectUri || !config.token?.refresh_token) {
        throw new Error('Saved clientId/redirectUri/refresh_token are required');
      }
      const token = await refreshAccessToken({
        clientId: config.clientId,
        clientSecret: options.clientSecret,
        redirectUri: config.redirectUri,
        refreshToken: config.token.refresh_token,
      });
      await saveConfig(configPath, { token });
      io.stdout(JSON.stringify(redactToken(token), null, 2));
    });

  program
    .command('me')
    .description('show the authenticated user')
    .action(async () => {
      const accessToken = await requireAccessToken(program.opts().config as string);
      const me = await fetchMe(accessToken);
      io.stdout(JSON.stringify(me, null, 2));
    });

  registerProjectListCommand(program.command('projects').description('project operations'), async (workspace) => {
    const accessToken = await requireAccessToken(program.opts().config as string);
    const items = await listProjects(accessToken, workspace);
    io.stdout(JSON.stringify(items, null, 2));
  });
  registerProjectListCommand(program.command('project').description('alias for projects'), async (workspace) => {
    const accessToken = await requireAccessToken(program.opts().config as string);
    const items = await listProjects(accessToken, workspace);
    io.stdout(JSON.stringify(items, null, 2));
  });

  const workspaces = program.command('workspaces').description('workspace operations');
  workspaces
    .command('list')
    .description('list available workspaces')
    .action(async () => {
      const accessToken = await requireAccessToken(program.opts().config as string);
      const items = await listWorkspaces(accessToken);
      io.stdout(JSON.stringify(items, null, 2));
    });

  try {
    await program.parseAsync(['node', 'asana-oauth', ...argv]);
  } catch (error) {
    io.stderr(error instanceof Error ? error.message : String(error));
    io.exit(1);
  }
}

async function requireAccessToken(configPath: string): Promise<string> {
  const config = await loadConfig(configPath);
  if (!config.token?.access_token) {
    throw new Error('No access token saved. Run `auth exchange` first.');
  }
  return config.token.access_token;
}

function registerProjectListCommand(
  command: Command,
  action: (workspace: string) => Promise<void>,
): void {
  command
    .command('list')
    .description('list projects in a workspace')
    .requiredOption('--workspace <gid>', 'workspace gid')
    .action(async (options: { workspace: string }) => {
      await action(options.workspace);
    });
}

function redactToken(token: TokenData): TokenData {
  return {
    ...token,
    access_token: '***',
    refresh_token: token.refresh_token ? '***' : undefined,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await runCli(process.argv.slice(2));
}
