# asana-oauth-cli

[![CI](https://github.com/ktutumi/asana-oauth-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/ktutumi/asana-oauth-cli/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/ktutumi/asana-oauth-cli)](https://github.com/ktutumi/asana-oauth-cli/releases/tag/v0.1.0)

A lightweight Asana OAuth CLI for personal use.

Supported commands:
- `auth url` — Generate an authorization URL
- `auth exchange` — Exchange an authorization code for access/refresh tokens and save them
- `auth login` — Auto-receive a localhost callback and automate token exchange
- `auth refresh` — Refresh tokens using a saved refresh token
- `me` — Call `GET /users/me` with a saved access token
- `projects list` — List projects under a workspace via `GET /projects?workspace=...` (`project list` is an alias)
- `tasks list` — List tasks under a project via `GET /projects/{project_gid}/tasks`
- `tasks get` — Get a single task via `GET /tasks/{task_gid}`
- `tasks subtasks` — List subtasks of a task via `GET /tasks/{task_gid}/subtasks`
- `tasks stories` — List stories (comments/history) of a task via `GET /tasks/{task_gid}/stories`
- `tasks attachments` — List attachments of a task via `GET /tasks/{task_gid}/attachments`
- `workspaces list` — List workspaces via `GET /workspaces`

## Prerequisites

- Node.js 20+
- An OAuth App created in the Asana Developer Console

Example Asana OAuth App settings:
- `Redirect URL`: `urn:ietf:wg:oauth:2.0:oob`

For CLI use, the OOB redirect URI is the simplest option. After authorizing in the browser, Asana displays the code, which you then paste into the CLI.

If you prefer localhost callback, register the same redirect URI on the Asana side. Examples:
- `http://127.0.0.1:18787/callback`
- `http://localhost:18787/callback`

## Installation

If `pnpm` is not available, enable it first with `corepack enable` or your preferred method.

You also need to run `pnpm setup` once. If `pnpm link --global` shows `ERR_PNPM_NO_GLOBAL_BIN_DIR`, add `PNPM_HOME` and PATH to your shell initialization file, then open a new shell.

After `pnpm link --global`, the main command name is `asn`.

```bash
pnpm setup
# reopen your shell
pnpm install
pnpm build
pnpm link --global
```

Or run in development mode without building:

```bash
pnpm dev -- --help
```

## Usage

### 1. Generate an authorization URL

The default scope for `auth url` and `auth login` is `users:read workspaces:read projects:read tasks:read stories:read attachments:read`. This is the minimal set of scopes required by the current CLI features.

```bash
asn auth url \
  --client-id "$ASANA_CLIENT_ID" \
  --redirect-uri urn:ietf:wg:oauth:2.0:oob
```

Open the output URL in a browser, then note the displayed authorization code.

### 2. Log in with localhost callback

Register a redirect URL such as the following in the Asana Developer Console:

- `http://127.0.0.1:18787/callback`

Then run:

```bash
asn auth login \
  --client-id "$ASANA_CLIENT_ID" \
  --client-secret "$ASANA_CLIENT_SECRET" \
  --redirect-uri http://127.0.0.1:18787/callback
```

The CLI starts a localhost listener and displays the URL to open in a browser. Once Asana redirects back, it automatically receives the code and completes token exchange and storage.

Notes:
- `auth login` only accepts `http://localhost/...` or `http://127.0.0.1/...` redirect URIs
- The redirect URL must exactly match what is registered on the Asana side
- The default listen timeout is 120 seconds. Extend it with `--listen-timeout-ms 300000` if needed

### 3. Exchange a code for tokens and save them

```bash
asn auth exchange \
  --client-id "$ASANA_CLIENT_ID" \
  --client-secret "$ASANA_CLIENT_SECRET" \
  --redirect-uri urn:ietf:wg:oauth:2.0:oob \
  --code "$ASANA_CODE"
```

Credentials are saved to:

```text
~/.config/asana-oauth-cli/credentials.json
```

Override the path with `--config /path/to/credentials.json`.

### 4. Show user info

```bash
asn me
```

### 5. List workspaces

```bash
asn workspaces list
```

### 6. List projects

```bash
asn projects list --workspace "$ASANA_WORKSPACE_GID"
```

`asn project list ...` also works as a backward-compatible alias.

### 7. List tasks

```bash
asn tasks list --project "$ASANA_PROJECT_GID"
```

### 8. Get a task

```bash
asn tasks get --task "$ASANA_TASK_GID"
```

### 9. List subtasks

```bash
asn tasks subtasks --task "$ASANA_TASK_GID"
```

### 10. List task stories (comments/history)

```bash
asn tasks stories --task "$ASANA_TASK_GID"
```

### 11. List task attachments

```bash
asn tasks attachments --task "$ASANA_TASK_GID"
```

### 12. Refresh tokens

```bash
asn auth refresh --client-secret "$ASANA_CLIENT_SECRET"
```

## Development

```bash
pnpm test
pnpm build
pnpm lint:types
```

## Implementation Notes

- OAuth authorization URL: `https://app.asana.com/-/oauth_authorize`
- OAuth token endpoint: `https://app.asana.com/-/oauth_token`
- API base URL: `https://app.asana.com/api/1.0`
- An `expires_at` timestamp is computed and stored alongside tokens
- Default scope: `users:read workspaces:read projects:read tasks:read stories:read attachments:read`