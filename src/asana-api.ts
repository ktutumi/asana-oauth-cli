import type { TokenData } from './config.js';

const oauthTokenEndpoint = 'https://app.asana.com/-/oauth_token';
const apiBase = 'https://app.asana.com/api/1.0';

export type OAuthExchangeInput = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  code: string;
  now?: () => Date;
};

export type OAuthRefreshInput = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken: string;
  now?: () => Date;
};

export async function exchangeCodeForToken(input: OAuthExchangeInput): Promise<TokenData> {
  return postToken([
    ['grant_type', 'authorization_code'],
    ['client_id', input.clientId],
    ['client_secret', input.clientSecret],
    ['redirect_uri', input.redirectUri],
    ['code', input.code],
  ], input.now);
}

export async function refreshAccessToken(input: OAuthRefreshInput): Promise<TokenData> {
  return postToken([
    ['grant_type', 'refresh_token'],
    ['client_id', input.clientId],
    ['client_secret', input.clientSecret],
    ['redirect_uri', input.redirectUri],
    ['refresh_token', input.refreshToken],
  ], input.now);
}

export async function fetchMe(accessToken: string): Promise<Record<string, unknown>> {
  const response = await fetch(`${apiBase}/users/me`, {
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${accessToken}`,
    },
  });
  return unwrapData(response);
}

export async function listWorkspaces(accessToken: string): Promise<Record<string, unknown>[]> {
  const response = await fetch(`${apiBase}/workspaces`, {
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${accessToken}`,
    },
  });
  return unwrapData(response);
}

export async function listProjects(accessToken: string, workspace: string): Promise<Record<string, unknown>[]> {
  const items: Record<string, unknown>[] = [];
  const url = new URL(`${apiBase}/projects`);
  url.searchParams.set('workspace', workspace);

  while (true) {
    const response = await fetch(url.toString(), {
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${accessToken}`,
      },
    });

    const payload = await parseJson<{
      data: Record<string, unknown>[];
      next_page?: { offset?: string } | null;
    }>(response);
    items.push(...payload.data);

    const offset = payload.next_page?.offset;
    if (!offset) {
      return items;
    }

    url.searchParams.set('offset', offset);
  }
}

export async function listTasks(accessToken: string, project: string): Promise<Record<string, unknown>[]> {
  const items: Record<string, unknown>[] = [];
  const url = new URL(`${apiBase}/projects/${encodeURIComponent(project)}/tasks`);

  while (true) {
    const response = await fetch(url.toString(), {
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${accessToken}`,
      },
    });

    const payload = await parseJson<{
      data: Record<string, unknown>[];
      next_page?: { offset?: string } | null;
    }>(response);
    items.push(...payload.data);

    const offset = payload.next_page?.offset;
    if (!offset) {
      return items;
    }

    url.searchParams.set('offset', offset);
  }
}

export async function getTask(accessToken: string, taskGid: string): Promise<Record<string, unknown>> {
  const response = await fetch(`${apiBase}/tasks/${encodeURIComponent(taskGid)}`, {
    headers: {
      accept: 'application/json',
      authorization: `Bearer ${accessToken}`,
    },
  });
  return unwrapData(response);
}

export async function listSubtasks(accessToken: string, taskGid: string): Promise<Record<string, unknown>[]> {
  const items: Record<string, unknown>[] = [];
  const url = new URL(`${apiBase}/tasks/${encodeURIComponent(taskGid)}/subtasks`);

  while (true) {
    const response = await fetch(url.toString(), {
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${accessToken}`,
      },
    });

    const payload = await parseJson<{
      data: Record<string, unknown>[];
      next_page?: { offset?: string } | null;
    }>(response);
    items.push(...payload.data);

    const offset = payload.next_page?.offset;
    if (!offset) {
      return items;
    }

    url.searchParams.set('offset', offset);
  }
}

export async function listStories(accessToken: string, taskGid: string): Promise<Record<string, unknown>[]> {
  const items: Record<string, unknown>[] = [];
  const url = new URL(`${apiBase}/tasks/${encodeURIComponent(taskGid)}/stories`);

  while (true) {
    const response = await fetch(url.toString(), {
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${accessToken}`,
      },
    });

    const payload = await parseJson<{
      data: Record<string, unknown>[];
      next_page?: { offset?: string } | null;
    }>(response);
    items.push(...payload.data);

    const offset = payload.next_page?.offset;
    if (!offset) {
      return items;
    }

    url.searchParams.set('offset', offset);
  }
}

export async function listAttachments(accessToken: string, taskGid: string): Promise<Record<string, unknown>[]> {
  const items: Record<string, unknown>[] = [];
  const url = new URL(`${apiBase}/tasks/${encodeURIComponent(taskGid)}/attachments`);

  while (true) {
    const response = await fetch(url.toString(), {
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${accessToken}`,
      },
    });

    const payload = await parseJson<{
      data: Record<string, unknown>[];
      next_page?: { offset?: string } | null;
    }>(response);
    items.push(...payload.data);

    const offset = payload.next_page?.offset;
    if (!offset) {
      return items;
    }

    url.searchParams.set('offset', offset);
  }
}

async function postToken(body: Array<[string, string]>, now: (() => Date) | undefined): Promise<TokenData> {
  const response = await fetch(oauthTokenEndpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(body),
  });

  const token = await parseJson<TokenData>(response);
  const issuedAt = (now ?? (() => new Date()))();
  return {
    ...token,
    expires_at: token.expires_in
      ? new Date(issuedAt.getTime() + token.expires_in * 1000).toISOString()
      : token.expires_at,
  };
}

async function unwrapData<T>(response: Response): Promise<T> {
  const payload = await parseJson<{ data: T }>(response);
  return payload.data;
}

async function parseJson<T>(response: Response): Promise<T> {
  const payload = await response.json() as T | { errors?: Array<{ message?: string }> };
  if (!response.ok) {
    const message = Array.isArray((payload as { errors?: Array<{ message?: string }> }).errors)
      ? (payload as { errors?: Array<{ message?: string }> }).errors?.map((item) => item.message).filter(Boolean).join('; ')
      : response.statusText;
    throw new Error(message || 'Asana API request failed');
  }
  return payload as T;
}
