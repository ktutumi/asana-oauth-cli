import { afterEach, describe, expect, it } from 'vitest';
import { waitForOAuthCallback } from '../src/oauth-callback.js';

const serversToClose: Array<{ close: () => Promise<void> }> = [];

afterEach(async () => {
  await Promise.all(serversToClose.splice(0).map((server) => server.close()));
});

describe('oauth callback server', () => {
  it('receives the authorization code and state from localhost callback', async () => {
    const listener = await waitForOAuthCallback({
      hostname: '127.0.0.1',
      port: 0,
      callbackPath: '/callback',
      timeoutMs: 2_000,
    });
    serversToClose.push(listener);

    const response = await fetch(`${listener.callbackUrl}?code=code-123&state=state-abc`);
    const body = await response.text();
    const callback = await listener.result;

    expect(response.status).toBe(200);
    expect(body).toContain('Asana OAuth login completed');
    expect(callback).toEqual({ code: 'code-123', state: 'state-abc' });
  });

  it('returns an error page when code is missing', async () => {
    const listener = await waitForOAuthCallback({
      hostname: '127.0.0.1',
      port: 0,
      callbackPath: '/callback',
      timeoutMs: 2_000,
    });
    serversToClose.push(listener);

    const resultPromise = listener.result;
    void resultPromise.catch(() => undefined);

    const response = await fetch(`${listener.callbackUrl}?state=state-abc`);
    const body = await response.text();

    expect(response.status).toBe(400);
    expect(body).toContain('Missing `code` query parameter');
    await expect(resultPromise).rejects.toThrow('Missing `code` query parameter');
  });

  it('does not crash if an extra browser request arrives around callback completion', async () => {
    const listener = await waitForOAuthCallback({
      hostname: '127.0.0.1',
      port: 0,
      callbackPath: '/callback',
      timeoutMs: 2_000,
    });
    serversToClose.push(listener);

    const callbackPromise = fetch(`${listener.callbackUrl}?code=code-123&state=state-abc`);
    const extraRequestPromise = fetch(listener.callbackUrl.replace('/callback', '/favicon.ico')).catch((error) => error);

    const callbackResponse = await callbackPromise;
    const extraResult = await extraRequestPromise;
    const callback = await listener.result;

    expect(callbackResponse.status).toBe(200);
    expect(callback).toEqual({ code: 'code-123', state: 'state-abc' });
    expect(extraResult instanceof Error).toBe(false);
    if (!(extraResult instanceof Error)) {
      expect([200, 404]).toContain(extraResult.status);
    }
  });
});
