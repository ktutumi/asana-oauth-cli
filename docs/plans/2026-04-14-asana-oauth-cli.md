# Asana OAuth CLI Implementation Plan

> For Hermes: Use test-first development for every production behavior.

Goal: 個人利用向けの軽量 Asana OAuth CLI を新規リポジトリとして作成する。

Architecture: Node.js + TypeScript の単一CLI。Asana OAuth認可URL生成、authorization code 交換、refresh token 更新、保存済みトークンを使った `me` / `workspaces list` API 呼び出しを提供する。認証情報は `~/.config/asana-oauth-cli/credentials.json` に保存する。

Tech Stack: Node 25, TypeScript, Vitest, Commander, ネイティブ fetch

---

### Task 1: プロジェクトの土台を作る
Objective: package.json / tsconfig / テスト環境を用意する
Files:
- Create: package.json
- Create: tsconfig.json
- Create: vitest.config.ts
- Create: .gitignore
- Create: src/
- Create: tests/

Steps:
1. package.json に `build`, `test`, `dev`, `lint:types` を定義する
2. TypeScript と Vitest を追加する
3. `src/` と `tests/` を作る
4. `npm test` が空テストで通る状態を作る

### Task 2: OAuth URL 生成をTDDで実装する
Objective: `auth url` コマンドで Asana OAuth URL を出せるようにする
Files:
- Create: src/oauth.ts
- Create: tests/oauth.test.ts
- Modify: src/cli.ts

Steps:
1. スコープ、state、redirect_uri を含むURL文字列のテストを書く
2. 失敗を確認する
3. 最小実装を書く
4. テストを再実行して通す

### Task 3: 認証情報ストアをTDDで実装する
Objective: OAuth クライアント情報とトークンをファイル保存できるようにする
Files:
- Create: src/config.ts
- Create: tests/config.test.ts

Steps:
1. 保存/読込/マージのテストを書く
2. 失敗を確認する
3. XDG準拠の設定保存実装を書く
4. テストを通す

### Task 4: code交換/refreshをTDDで実装する
Objective: `auth exchange` と `auth refresh` を動かす
Files:
- Create: src/asana-api.ts
- Create: tests/asana-api.test.ts
- Modify: src/cli.ts

Steps:
1. fetch モックで token exchange / refresh のテストを書く
2. 失敗を確認する
3. 最小実装を書く
4. テストを通す

### Task 5: APIコマンドをTDDで実装する
Objective: `me` と `workspaces list` を保存済みアクセストークンで叩けるようにする
Files:
- Modify: src/asana-api.ts
- Modify: src/cli.ts
- Create: tests/cli.test.ts

Steps:
1. Authorization ヘッダとレスポンス整形のテストを書く
2. 失敗を確認する
3. 実装を書く
4. テストとビルドを通す

### Task 6: README と実行確認
Objective: 導入手順と OAuth 手順を README にまとめる
Files:
- Create: README.md

Steps:
1. Asana Developer Console での app 作成手順を書く
2. `urn:ietf:wg:oauth:2.0:oob` と localhost callback の使い分けを書く
3. 実コマンド例を追加する
4. `npm test` と `npm run build` を確認する

### Task 7: localhost callback 自動受信をTDDで実装する
Objective: `auth login` コマンドでローカルHTTPサーバーを起動し、callback で受け取った authorization code をそのまま token 交換・保存できるようにする
Files:
- Create: src/oauth-callback.ts
- Create: tests/oauth-callback.test.ts
- Modify: src/cli.ts
- Modify: tests/cli.test.ts
- Modify: README.md

Steps:
1. localhost callback サーバーが `code` と `state` を受け取るテストを書く
2. テストを実行して失敗を確認する
3. 最小の HTTP サーバー実装を書く
4. `auth login` が callback を待って token 交換・保存まで行うテストを書く
5. テストを実行して失敗を確認する
6. CLI に `auth login` を実装する
7. `npm test`, `npm run build`, `npm run lint:types` で確認する
