# init-deep AGENTS hierarchy

- リポジトリは 21 tracked files、最大深さ 2。過剰な階層化は不要。
- `src/` は実装責務、`tests/` は検証責務で明確に分かれるため、root 配下に 2 つだけ子 `AGENTS.md` を置く。
- `docs/` や `.github/` はファイル数が少なく、root 参照で十分。個別 `AGENTS.md` は増やさない。
- root は索引用、子は変更時の注意点と touch point に寄せて重複を抑える。
