import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  exchangeCodeForToken,
  fetchMe,
  listProjects,
  listTasks,
  listWorkspaces,
  refreshAccessToken,
} from '../src/asana-api.js';

describe('asana api', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('exchanges an authorization code for a token and computes expires_at', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'access-1',
        refresh_token: 'refresh-1',
        token_type: 'bearer',
        expires_in: 3600,
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const token = await exchangeCodeForToken({
      clientId: 'client-1',
      clientSecret: 'secret-1',
      code: 'code-1',
      redirectUri: 'urn:ietf:wg:oauth:2.0:oob',
      now: () => new Date('2026-04-14T03:00:00.000Z'),
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://app.asana.com/-/oauth_token',
      expect.objectContaining({
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
      }),
    );

    const request = fetchMock.mock.calls[0]?.[1];
    expect((request?.body as URLSearchParams).toString()).toBe(
      'grant_type=authorization_code&client_id=client-1&client_secret=secret-1&redirect_uri=urn%3Aietf%3Awg%3Aoauth%3A2.0%3Aoob&code=code-1',
    );

    expect(token).toEqual({
      access_token: 'access-1',
      refresh_token: 'refresh-1',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: '2026-04-14T04:00:00.000Z',
    });
  });

  it('refreshes an access token with a refresh token', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        access_token: 'access-2',
        refresh_token: 'refresh-2',
        token_type: 'bearer',
        expires_in: 7200,
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const token = await refreshAccessToken({
      clientId: 'client-1',
      clientSecret: 'secret-1',
      refreshToken: 'refresh-1',
      redirectUri: 'urn:ietf:wg:oauth:2.0:oob',
      now: () => new Date('2026-04-14T03:00:00.000Z'),
    });

    const request = fetchMock.mock.calls[0]?.[1];
    expect((request?.body as URLSearchParams).toString()).toBe(
      'grant_type=refresh_token&client_id=client-1&client_secret=secret-1&redirect_uri=urn%3Aietf%3Awg%3Aoauth%3A2.0%3Aoob&refresh_token=refresh-1',
    );

    expect(token).toEqual({
      access_token: 'access-2',
      refresh_token: 'refresh-2',
      token_type: 'bearer',
      expires_in: 7200,
      expires_at: '2026-04-14T05:00:00.000Z',
    });
  });

  it('fetches the authenticated user profile', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { gid: '123', name: 'Alice' } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const me = await fetchMe('access-1');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://app.asana.com/api/1.0/users/me',
      expect.objectContaining({
        headers: {
          accept: 'application/json',
          authorization: 'Bearer access-1',
        },
      }),
    );
    expect(me).toEqual({ gid: '123', name: 'Alice' });
  });

  it('lists workspaces for the authenticated user', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ gid: '1', name: 'Personal' }] }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const workspaces = await listWorkspaces('access-1');

    expect(workspaces).toEqual([{ gid: '1', name: 'Personal' }]);
  });

  it('lists projects for the authenticated user workspace across paginated responses', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ gid: '10', name: 'Roadmap' }],
          next_page: { offset: 'next-1' },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ gid: '11', name: 'Backlog' }],
          next_page: null,
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const projects = await listProjects('access-1', 'workspace-1');

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://app.asana.com/api/1.0/projects?workspace=workspace-1',
      expect.objectContaining({
        headers: {
          accept: 'application/json',
          authorization: 'Bearer access-1',
        },
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://app.asana.com/api/1.0/projects?workspace=workspace-1&offset=next-1',
      expect.objectContaining({
        headers: {
          accept: 'application/json',
          authorization: 'Bearer access-1',
        },
      }),
    );
    expect(projects).toEqual([
      { gid: '10', name: 'Roadmap' },
      { gid: '11', name: 'Backlog' },
    ]);
  });

  it('lists tasks for a project across paginated responses', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ gid: '101', name: 'Ship pnpm migration' }],
          next_page: { offset: 'next-1' },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ gid: '102', name: 'Review CI' }],
          next_page: null,
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const tasks = await listTasks('access-1', 'project-1');

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'https://app.asana.com/api/1.0/projects/project-1/tasks',
      expect.objectContaining({
        headers: {
          accept: 'application/json',
          authorization: 'Bearer access-1',
        },
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'https://app.asana.com/api/1.0/projects/project-1/tasks?offset=next-1',
      expect.objectContaining({
        headers: {
          accept: 'application/json',
          authorization: 'Bearer access-1',
        },
      }),
    );
    expect(tasks).toEqual([
      { gid: '101', name: 'Ship pnpm migration' },
      { gid: '102', name: 'Review CI' },
    ]);
  });

  it('encodes the project gid when listing tasks', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [], next_page: null }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await listTasks('access-1', 'project/with?special');

    expect(fetchMock).toHaveBeenCalledWith(
      'https://app.asana.com/api/1.0/projects/project%2Fwith%3Fspecial/tasks',
      expect.objectContaining({
        headers: {
          accept: 'application/json',
          authorization: 'Bearer access-1',
        },
      }),
    );
  });
});