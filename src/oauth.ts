import { randomBytes } from 'node:crypto';

export const authorizationEndpoint = 'https://app.asana.com/-/oauth_authorize';
export const defaultScopes = ['users:read', 'workspaces:read'];
export const defaultLocalhostRedirectUri = 'http://127.0.0.1:18787/callback';

export type AuthorizationUrlOptions = {
  clientId: string;
  redirectUri: string;
  scopes?: string[];
  state?: string;
};

export function generateState(): string {
  return randomBytes(32).toString('base64url');
}

export function buildAuthorizationUrl(options: AuthorizationUrlOptions): string {
  const params = new URLSearchParams({
    client_id: options.clientId,
    redirect_uri: options.redirectUri,
    response_type: 'code',
    scope: (options.scopes && options.scopes.length > 0 ? options.scopes : defaultScopes).join(' '),
  });

  if (options.state) {
    params.set('state', options.state);
  }

  return `${authorizationEndpoint}?${params.toString().replace(/\+/g, '%20')}`;
}
