# PROJECT KNOWLEDGE BASE

**Generated:** 2026-04-14 14:39:19
**Commit:** 10a562b
**Branch:** main

## OVERVIEW
個人利用向け Asana OAuth CLI。Node.js + TypeScript + Commander + Vitest の単一バイナリ構成。

## STRUCTURE
```text
asana-oauth-cli/
├── src/            # CLI 本体。コマンド定義、OAuth、API、設定保存
├── tests/          # Vitest。機能単位の挙動テスト
├── docs/plans/     # 実装計画と TDD 方針の履歴
├── .github/        # CI と PR チェックリスト
├── dist/           # TypeScript ビルド成果物。追跡対象外
└── package.json    # 実行コマンドと bin 定義
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| CLI の入口を追う | `src/bin.ts`, `src/cli.ts` | `bin.ts` は薄い委譲、実処理は `runCli` |
| OAuth URL/状態生成 | `src/oauth.ts` | 既定 redirect と scope もここ |
| localhost callback | `src/oauth-callback.ts` | `auth login` の待受処理 |
| Asana API 呼び出し | `src/asana-api.ts` | token exchange / refresh / users / workspaces / projects |
| 認証情報の保存 | `src/config.ts` | `~/.config/asana-oauth-cli/credentials.json` |
| CLI の挙動確認 | `tests/cli.test.ts` | I/O 注入で stdout/stderr/exit を検証 |
| OAuth 系のテスト | `tests/oauth*.test.ts` | URL 生成と callback 待受 |
| API/設定のテスト | `tests/asana-api.test.ts`, `tests/config.test.ts` | fetch stub と一時ファイル中心 |
| 実装方針の参照 | `docs/plans/2026-04-14-asana-oauth-cli.md` | test-first を明記 |
| CI 条件 | `.github/workflows/ci.yml` | `npm test` → `build` → `lint:types` |

## CODE MAP
| Symbol | Type | Location | Refs | Role |
|--------|------|----------|------|------|
| `runCli` | function | `src/cli.ts` | high | Commander の組み立てと全コマンド登録 |
| `exchangeCodeForToken` | function | `src/asana-api.ts` | medium | code 交換 |
| `refreshAccessToken` | function | `src/asana-api.ts` | medium | refresh token 更新 |
| `listProjects` | function | `src/asana-api.ts` | medium | project 一覧。pagination 対応 |
| `defaultConfigPath` | function | `src/config.ts` | medium | 保存先解決 |
| `saveConfig` | function | `src/config.ts` | medium | merge 保存 |
| `waitForOAuthCallback` | function | `src/oauth-callback.ts` | medium | localhost callback 受信 |

## CONVENTIONS
- 入口は `package.json` の `bin` だが、実装の起点は `src/cli.ts`。
- `tsconfig.json` は `src/**/*.ts` だけでなく `tests/**/*.ts` も compile 対象。
- Lint 専用ツールはなく、品質ゲートは `npm run lint:types` (`tsc --noEmit`)。
- CI と PR テンプレは `npm test` / `npm run build` / `npm run lint:types` を必須扱い。
- ESM + `NodeNext`。import は `.js` 拡張子前提。

## ANTI-PATTERNS (THIS PROJECT)
- `auth login` で `http://localhost/...` または `http://127.0.0.1/...` 以外の redirect URI を受け入れない。
- `dist/` を読んで実装判断しない。正は `src/` と `tests/`。
- `tests/` を外して build 設定を変えると、現行の型チェック前提が崩れる可能性がある。
- `lint:types` を飛ばして完了扱いにしない。CI の最終ゲート。

## UNIQUE STYLES
- 小規模 CLI だが責務分離は明確。`cli` / `asana-api` / `config` / `oauth*` の職能別。
- CLI は `CliIo` を注入できるため、標準入出力を直接触る前に `runCli` の seam を維持する。
- テストヘルパー共通化はしていない。各テストが自己完結する方針。

## COMMANDS
```bash
npm test
npm run build
npm run lint:types
npm run dev -- --help
```

## SUBDIR GUIDE
- `src/` を触る前に `src/AGENTS.md` を読む。
- `tests/` を触る前に `tests/AGENTS.md` を読む。

## NOTES
- Node 要件は `package.json` で `>=20`、CI は Node 22。
- `dist/tests/*.js` も生成されるが、Vitest の対象は `tests/**/*.test.ts`。
- 既存の `AGENTS.md` はなかったため、この階層が初回生成。
