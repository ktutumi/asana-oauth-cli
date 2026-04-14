# SRC GUIDE

## OVERVIEW
`src/` は単一 CLI の本体。入口、コマンド定義、OAuth、API、設定保存を責務分離している。

## STRUCTURE
```text
src/
├── bin.ts             # npm bin から呼ばれる薄い入口
├── cli.ts             # Commander 定義、I/O 制御、コマンド配線
├── oauth.ts           # 認可 URL、state、既定 scope
├── oauth-callback.ts  # localhost callback server
├── asana-api.ts       # Asana REST 呼び出し
└── config.ts          # credentials.json 読み書き
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| 新コマンド追加 | `cli.ts` | `runCli` に集約 |
| OAuth redirect/scope 変更 | `oauth.ts`, `cli.ts` | README も追従 |
| callback 受信変更 | `oauth-callback.ts` | timeout と path を維持 |
| API endpoint 追加 | `asana-api.ts` | `unwrapData` / `parseJson` を使う |
| 保存形式変更 | `config.ts` | `saveConfig` は merge 保存 |

## CONVENTIONS
- `bin.ts` は薄く保つ。実装ロジックを増やさない。
- CLI 実装は `runCli(argv, io?)` に寄せ、`process.exit` や `console.*` を直接散らさない。
- fetch 結果は Asana API 側で unwrap し、CLI 側は表示と制御に集中させる。
- import は ESM 形式で `.js` 拡張子を付ける。

## ANTI-PATTERNS
- `auth login` の redirect URI 制約を外さない。`localhost` / `127.0.0.1` のみ。
- token をそのまま stdout に出さない。`redactToken` を通す。
- 設定保存で既存 token を丸ごと破棄しない。`saveConfig` の merge を壊さない。
- CLI 分岐を `bin.ts` に複製しない。

## TOUCH POINTS
- `cli.ts:22` `runCli`
- `cli.ts:182` `requireAccessToken`
- `asana-api.ts:90` `postToken`
- `config.ts:36` `saveConfig`

## CHECKS
```bash
npm test
npm run build
npm run lint:types
```

## NOTES
- `tsconfig.json` の都合で `src/` 変更でも `tests/` の型エラーが build に影響する。
- `import.meta.url` 直実行ガードは開発実行で使う。削らない。
