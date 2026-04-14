# Issue #3 Plan

## Goal
`AGENTS.md` の階層ガイドを root / `src/` / `tests/` に追加し、`CLAUDE.md` から同内容を参照できるようにする。

## Scope
- `AGENTS.md`
- `CLAUDE.md`
- `src/AGENTS.md`
- `src/CLAUDE.md`
- `tests/AGENTS.md`
- `tests/CLAUDE.md`
- `_docs/ai/features/*`
- `_docs/ai/thinking/*`

## Steps
1. リポジトリ構造と既存ルールを調査し、必要な `AGENTS.md` の配置を決める
2. root / `src/` / `tests/` の各ガイドを作成する
3. `CLAUDE.md` を `AGENTS.md` への symlink として追加する
4. 判断理由と機能追加の記録を `_docs/ai/` に残す
5. `npm test` / `npm run build` / `npm run lint:types` で検証する

## Verification
- `npm test`
- `npm run build`
- `npm run lint:types`

## Risks
- symlink が環境依存で扱いづらい可能性がある
- root と子ガイドの重複が増えるとメンテナンスコストが上がる
