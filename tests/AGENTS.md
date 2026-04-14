# TEST GUIDE

## OVERVIEW
`tests/` は Vitest による機能別テスト群。CLI、OAuth、API、設定保存をファイル単位で分けている。

## STRUCTURE
```text
tests/
├── cli.test.ts             # Commander 経由の挙動
├── oauth.test.ts           # 認可 URL と state
├── oauth-callback.test.ts  # localhost callback 待受
├── asana-api.test.ts       # fetch stub ベースの API テスト
├── config.test.ts          # 一時ファイルへの保存/読込
└── smoke.test.ts           # テストランナー疎通確認
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| CLI の成功/失敗系 | `cli.test.ts` | `runCli` に `io` を注入 |
| fetch モックの書き方 | `asana-api.test.ts` | `vi.stubGlobal('fetch', ...)` |
| 一時設定ファイル | `config.test.ts` | `mkdtempSync` で自己完結 |
| callback サーバー | `oauth-callback.test.ts` | 実 localhost ポートを使う |

## CONVENTIONS
- テスト名は `*.test.ts`。`spec` は使わない。
- 共有 fixture ディレクトリは持たない。各ファイルが inline で必要データを作る。
- グローバル stub は `afterEach` で戻す。
- CLI は標準出力を直接読まず、注入 I/O で検証する。

## ANTI-PATTERNS
- `dist/tests/*.js` をテスト対象と勘違いしない。正は `tests/**/*.test.ts`。
- 外部ネットワークに依存したテストを追加しない。fetch は stub 前提。
- 一時ファイルやグローバル stub の cleanup を省略しない。
- `smoke.test.ts` を重い統合テストに変えない。存在確認のまま保つ。

## CHECKS
```bash
pnpm test
```

## NOTES
- coverage reporter はあるが閾値はない。
- `tsconfig.json` が `tests/**/*.ts` を compile 対象に含むため、型エラーは build でも検出される。
