# symlink CLAUDE.md to AGENTS.md

## 目的
`CLAUDE.md` を参照するツール系ワークフローでも、作成済みの `AGENTS.md` 階層を同じ内容で参照できるようにする。

## 対象
- `CLAUDE.md` -> `AGENTS.md`
- `src/CLAUDE.md` -> `src/AGENTS.md`
- `tests/CLAUDE.md` -> `tests/AGENTS.md`

## 方針
- 内容の二重管理は避ける。
- 既存の `AGENTS.md` を正本にして、`CLAUDE.md` は symlink にする。
