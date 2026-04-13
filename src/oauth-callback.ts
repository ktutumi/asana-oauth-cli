import { createServer, type Server } from 'node:http';

export type OAuthCallbackResult = {
  code: string;
  state?: string;
};

export type OAuthCallbackListener = {
  callbackUrl: string;
  result: Promise<OAuthCallbackResult>;
  close: () => Promise<void>;
};

export type WaitForOAuthCallbackOptions = {
  hostname: string;
  port: number;
  callbackPath: string;
  timeoutMs: number;
};

export async function waitForOAuthCallback(options: WaitForOAuthCallbackOptions): Promise<OAuthCallbackListener> {
  let resolveResult!: (value: OAuthCallbackResult) => void;
  let rejectResult!: (reason?: unknown) => void;
  let timeout: NodeJS.Timeout | undefined;
  let settled = false;
  let callbackBaseUrl = '';

  const result = new Promise<OAuthCallbackResult>((resolve, reject) => {
    resolveResult = resolve;
    rejectResult = reject;
  });

  const server = createServer((request, response) => {
    const url = new URL(request.url ?? '/', callbackBaseUrl);

    if (url.pathname !== options.callbackPath) {
      response.statusCode = 404;
      response.setHeader('content-type', 'text/plain; charset=utf-8');
      response.end('Not found');
      return;
    }

    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state') ?? undefined;

    if (!code) {
      const error = new Error('Missing `code` query parameter');
      response.statusCode = 400;
      response.setHeader('content-type', 'text/plain; charset=utf-8');
      response.end('Missing `code` query parameter');
      settle(server, timeout, () => rejectResult(error), () => {
        settled = true;
      }, settled);
      return;
    }

    response.statusCode = 200;
    response.setHeader('content-type', 'text/plain; charset=utf-8');
    response.end('Asana OAuth login completed. You can close this tab.');
    settle(server, timeout, () => resolveResult({ code, state }), () => {
      settled = true;
    }, settled);
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(options.port, options.hostname, () => resolve());
  });

  timeout = setTimeout(() => {
    settle(server, timeout, () => rejectResult(new Error('Timed out waiting for OAuth callback')), () => {
      settled = true;
    }, settled);
  }, options.timeoutMs);

  callbackBaseUrl = `http://${options.hostname}:${addressPort(server)}`;

  return {
    callbackUrl: `${callbackBaseUrl}${options.callbackPath}`,
    result,
    close: async () => {
      settle(server, timeout, () => undefined, () => {
        settled = true;
      }, settled);
    },
  };
}

function settle(
  server: Server,
  timeout: NodeJS.Timeout | undefined,
  finish: () => void,
  markSettled: () => void,
  settled: boolean,
): void {
  if (settled) {
    return;
  }
  markSettled();
  if (timeout) {
    clearTimeout(timeout);
  }
  server.close();
  finish();
}

function addressPort(server: Server): number {
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Callback server is not listening on a TCP port');
  }
  return address.port;
}
