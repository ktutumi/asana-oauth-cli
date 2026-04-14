# ASN Bin Name Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** `pnpm link --global` で作成される実行ファイル名を `asana-oauth` から `asn` に変更する。

**Architecture:** npm/pnpm のリンク名は `package.json` の `bin` キーで決まるため、まずそこを `asn` に変更する。CLI の help/usage も利用者向けに一致させるため `src/cli.ts` の `program.name(...)` と parse の表示名を `asn` へ揃え、README の実行例も新しいコマンド名へ更新する。

**Tech Stack:** Node.js 20+, TypeScript, Commander, Vitest, pnpm

---

### Task 1: Add failing tests for bin metadata and CLI name

**Objective:** 配布される bin 名と help/usage 上の CLI 名が `asn` であることを固定する。

**Files:**
- Modify: `tests/cli.test.ts`
- Test: `tests/cli.test.ts`

**Step 1: Write failing tests**

```ts
import { readFileSync } from 'node:fs';

it('publishes the global bin as asn', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
    bin: Record<string, string>;
  };

  expect(pkg.bin).toEqual({ asn: 'dist/src/bin.js' });
});

it('uses asn in help output', async () => {
  const stdout: string[] = [];
  const result = await runCli(['--help'], {
    stdout: (line) => stdout.push(line),
    stderr: vi.fn(),
    exit: (code) => {
      throw new Error(`exit ${code}`);
    },
  }).catch((error) => error);

  expect(result).toBeInstanceOf(Error);
  expect(stdout.join('\n')).toContain('Usage: asn');
});
```

**Step 2: Run test to verify failure**

Run: `pnpm test -- --run tests/cli.test.ts`
Expected: FAIL — `package.json` の bin がまだ `asana-oauth`、help も `asana-oauth`。

**Step 3: Write minimal implementation**

この時点では未実装。RED を確認してから変更する。

**Step 4: Run test to verify pass**

このタスクでは未実施。

**Step 5: Commit**

```bash
git add tests/cli.test.ts
git commit -m "test: cover asn bin naming"
```

### Task 2: Update package metadata and Commander name

**Objective:** 実際の bin 名と help 表示名を `asn` に揃える。

**Files:**
- Modify: `package.json`
- Modify: `src/cli.ts`
- Test: `tests/cli.test.ts`

**Step 1: Run the failing test again**

Run: `pnpm test -- --run tests/cli.test.ts`
Expected: FAIL

**Step 2: Write minimal implementation**

```json
"bin": {
  "asn": "dist/src/bin.js"
}
```

```ts
program.name('asn');
...
await program.parseAsync(['node', 'asn', ...argv]);
```

**Step 3: Run focused test to verify pass**

Run: `pnpm test -- --run tests/cli.test.ts`
Expected: PASS

**Step 4: Commit**

```bash
git add package.json src/cli.ts tests/cli.test.ts
git commit -m "feat: rename global bin to asn"
```

### Task 3: Update README examples

**Objective:** 利用者向けのコマンド例を新しい実行名へ更新する。

**Files:**
- Modify: `README.md`

**Step 1: Update examples**

`asana-oauth ...` となっている利用例を `asn ...` に置換する。

**Step 2: Verify visually**

Run: `rg 'asana-oauth ' README.md`
Expected: no matches

**Step 3: Commit**

```bash
git add README.md
git commit -m "docs: update examples for asn command"
```

### Task 4: Full verification

**Objective:** 変更全体が既存機能を壊していないことを確認する。

**Files:**
- Modify: なし
- Test: `tests/*.test.ts`

**Step 1: Run full test suite**

Run: `pnpm test`
Expected: PASS

**Step 2: Run build and typecheck**

Run: `pnpm build && pnpm lint:types`
Expected: PASS

**Step 3: Independent review**

Run the requesting-code-review flow on the final diff.
Expected: PASS

**Step 4: Commit**

```bash
git add -A
git commit -m "[verified] feat: rename cli command to asn"
```
