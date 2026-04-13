import { describe, expect, it } from 'vitest';
import { buildAuthorizationUrl, defaultLocalhostRedirectUri, defaultScopes, generateState } from '../src/oauth.js';

describe('oauth helpers', () => {
  it('builds an Asana authorization URL with required parameters', () => {
    const url = buildAuthorizationUrl({
      clientId: 'client-123',
      redirectUri: 'urn:ietf:wg:oauth:2.0:oob',
      scopes: ['default', 'tasks:read'],
      state: 'state-abc',
    });

    expect(url).toBe(
      'https://app.asana.com/-/oauth_authorize?client_id=client-123&redirect_uri=urn%3Aietf%3Awg%3Aoauth%3A2.0%3Aoob&response_type=code&scope=default%20tasks%3Aread&state=state-abc',
    );
  });

  it('returns a secure random state token', () => {
    const state = generateState();

    expect(state).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it('exposes conservative explicit default scopes for current commands', () => {
    expect(defaultScopes).toEqual(['users:read', 'workspaces:read']);
  });

  it('uses a non-8787 localhost redirect URI default for auto login', () => {
    expect(defaultLocalhostRedirectUri).toBe('http://127.0.0.1:18787/callback');
  });
});
