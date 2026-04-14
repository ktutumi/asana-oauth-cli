# init-deep AGENTS hierarchy

## 目的
`AGENTS.md` の階層を導入し、AI エージェントが root 全体を毎回読み直さずに `src/` と `tests/` の局所ルールへ到達できるようにする。

## 対象
- `AGENTS.md`
- `src/AGENTS.md`
- `tests/AGENTS.md`

## 背景
- 既存の `AGENTS.md` は未作成。
- 小規模 CLI だが、実装とテストの責務分離は明確。
- CI / 型チェック / localhost redirect 制約など、寄稿時に落としやすいルールがある。

## 完了条件
- root に全体索引がある。
- `src/` と `tests/` に親の重複が少ない局所ガイドがある。
- 実行コマンド、touch point、anti-pattern を各階層で明記する。
