# asana-oauth-cli

[![CI](https://github.com/ktutumi/asana-oauth-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/ktutumi/asana-oauth-cli/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/ktutumi/asana-oauth-cli)](https://github.com/ktutumi/asana-oauth-cli/releases/tag/v0.1.0)

個人利用向けの軽量 Asana OAuth CLI です。

対応コマンド:
- `auth url` 認可URL生成
- `auth exchange` authorization code を access token / refresh token に交換して保存
- `auth login` localhost callback を自動受信して token 交換まで自動化
- `auth refresh` 保存済み refresh token で更新
- `me` 保存済み access token で `GET /users/me`
- `projects list` workspace 配下の project 一覧を `GET /projects?workspace=...` で取得 (`project list` は alias)
- `tasks list` project 配下の task 一覧を `GET /projects/{project_gid}/tasks` で取得
- `tasks get` 単一 task を `GET /tasks/{task_gid}` で取得
- `tasks subtasks` task の subtask 一覧を `GET /tasks/{task_gid}/subtasks` で取得
- `tasks stories` task の story (コメント/履歴) 一覧を `GET /tasks/{task_gid}/stories` で取得
- `tasks attachments` task の添付ファイル一覧を `GET /tasks/{task_gid}/attachments` で取得
- `workspaces list` 保存済み access token で `GET /workspaces`

## 前提

- Node.js 20+
- Asana Developer Console で OAuth App を作成済み

Asana OAuth App 作成時の設定例:
- `Redirect URL`: `urn:ietf:wg:oauth:2.0:oob`

CLI用途ではこの OOB redirect URI が扱いやすいです。ブラウザで認可後、Asana が code を表示するので、それを CLI に貼り付けます。

localhost callback を使いたい場合は、Asana 側にも同じ redirect URI を登録してください。例:
- `http://127.0.0.1:18787/callback`
- `http://localhost:18787/callback`

## インストール

`pnpm` が未導入なら、先に `corepack enable` などで pnpm を使える状態にしてください。

初回だけ `pnpm setup` も必要です。`pnpm link --global` で `ERR_PNPM_NO_GLOBAL_BIN_DIR` が出る場合は、shell 初期化ファイルに `PNPM_HOME` と PATH を追加してから、新しい shell を開き直してください。

`pnpm link --global` 後の主コマンド名は `asn` です。

```bash
pnpm setup
# shell を開き直す
pnpm install
pnpm build
pnpm link --global
```

またはビルドせずに開発実行:

```bash
pnpm dev -- --help
```

## 使い方

### 1. 認可URLを作る

`auth url` / `auth login` の既定スコープは `users:read workspaces:read projects:read tasks:read stories:read attachments:read` です。これは現在のCLI機能に必要な最小寄りのスコープです。

```bash
asn auth url \
  --client-id "$ASANA_CLIENT_ID" \
  --redirect-uri urn:ietf:wg:oauth:2.0:oob
```

出力された URL をブラウザで開き、表示された authorization code を控えます。

### 2. localhost callback で自動ログインする

Asana Developer Console 側で、たとえば次の Redirect URL を登録します。

- `http://127.0.0.1:18787/callback`

そのうえで次を実行します。

```bash
asn auth login \
  --client-id "$ASANA_CLIENT_ID" \
  --client-secret "$ASANA_CLIENT_SECRET" \
  --redirect-uri http://127.0.0.1:18787/callback
```

CLI が localhost で待ち受けを開始し、ブラウザで開くべき URL を表示します。Asana 認可後に callback が届くと、code を自動で受け取り、そのまま token 交換・保存まで行います。

注意:
- `auth login` は `http://localhost/...` または `http://127.0.0.1/...` のみ対応です
- Redirect URL は Asana 側に完全一致で登録してください
- 既定では 120 秒待機します。必要なら `--listen-timeout-ms 300000` のように延ばせます

### 3. code を token に交換して保存する

```bash
asn auth exchange \
  --client-id "$ASANA_CLIENT_ID" \
  --client-secret "$ASANA_CLIENT_SECRET" \
  --redirect-uri urn:ietf:wg:oauth:2.0:oob \
  --code "$ASANA_CODE"
```

保存先:

```text
~/.config/asana-oauth-cli/credentials.json
```

必要なら `--config /path/to/credentials.json` で変更できます。

### 4. ユーザー情報を確認する

```bash
asn me
```

### 5. workspace 一覧を取得する

```bash
asn workspaces list
```

### 6. project 一覧を取得する

```bash
asn projects list --workspace "$ASANA_WORKSPACE_GID"
```

`asn project list ...` も後方互換の alias として使えます。

### 7. task 一覧を取得する

```bash
asn tasks list --project "$ASANA_PROJECT_GID"
```

### 8. task の詳細を取得する

```bash
asn tasks get --task "$ASANA_TASK_GID"
```

### 9. task の subtask 一覧を取得する

```bash
asn tasks subtasks --task "$ASANA_TASK_GID"
```

### 10. task の story (コメント/履歴) を取得する

```bash
asn tasks stories --task "$ASANA_TASK_GID"
```

### 11. task の添付ファイル一覧を取得する

```bash
asn tasks attachments --task "$ASANA_TASK_GID"
```

### 12. token を更新する

```bash
asn auth refresh --client-secret "$ASANA_CLIENT_SECRET"
```

## 開発

```bash
pnpm test
pnpm build
pnpm lint:types
```

## 実装メモ

- OAuth 認可URL: `https://app.asana.com/-/oauth_authorize`
- OAuth token endpoint: `https://app.asana.com/-/oauth_token`
- API base: `https://app.asana.com/api/1.0`
- トークン保存時に `expires_at` を計算して JSON に書き込みます
- 既定スコープ: `users:read workspaces:read projects:read tasks:read stories:read attachments:read`