# Task Bundle

[English](./README.md) | [简体中文](./README.zh-CN.md)

Task Bundle is a TypeScript + Node.js CLI for packaging one AI coding task into a portable bundle directory.

It is designed for workflows where you want to:
- inspect what happened
- share a task with someone else
- rerun a task later
- compare outputs across tools and models
- grow toward replay and benchmark workflows

It is intentionally not:
- an agent framework
- a chat UI
- a provider router
- a benchmark platform
- a token-by-token recorder

## What Replay Means Here

Task Bundle replay is re-executable and comparable, not frame-identical.

The goal is not to reproduce every prompt or token exactly. The goal is to preserve enough context so the same task can be run again against the same starting materials, then compared across tools, models, or later iterations.

## Bundle Layout

```txt
task-bundle/
  bundle.json
  task.md
  summary.md
  events.jsonl
  result.diff
  workspace/
    manifest.json
    files/...
```

See:
- [docs/bundle-format.md](./docs/bundle-format.md)
- [docs/bundle-format.zh-CN.md](./docs/bundle-format.zh-CN.md)
- [docs/design-decisions.md](./docs/design-decisions.md)
- [docs/replay-contract.md](./docs/replay-contract.md)

## Five-Minute Demo

1. Install dependencies and build:

```bash
npm install
npm run build
```

2. Inspect the included example bundle:

```bash
npm run dev -- inspect ./examples/hello-world-bundle
```

3. Compare two example bundles produced by different tools:

```bash
npm run dev -- compare ./examples/hello-world-bundle ./examples/hello-world-bundle-claude
```

4. Validate the example bundle:

```bash
npm run dev -- validate ./examples/hello-world-bundle
```

5. Scan the whole examples directory:

```bash
npm run dev -- scan ./examples
```

6. Generate starter inputs:

```bash
npm run dev -- init --out ./starter
```

7. Pack from the generated config:

```bash
npm run dev -- pack --config ./starter/taskbundle.config.json
```

8. Archive the result:

```bash
npm run dev -- archive ./starter/bundle-output --out ./starter/bundle-output.tar.gz
```

## Commands

### `taskbundle init`
Create starter files for a new bundle:

```bash
npm run dev -- init --out ./starter
```

This writes:
- `task.md`
- `summary.md`
- `events.jsonl`
- `result.diff`
- `workspace-files/`
- `taskbundle.config.json`
- `README.md`

### `taskbundle pack`
Build a bundle directory from task artifacts.

Explicit flags:

```bash
npm run dev -- pack \
  --title "Fix auth bug" \
  --task ./starter/task.md \
  --summary ./starter/summary.md \
  --diff ./starter/result.diff \
  --events ./starter/events.jsonl \
  --workspace ./starter/workspace-files \
  --tool "codex" \
  --model "gpt-5" \
  --runtime "node" \
  --repo "owner/repo" \
  --commit "abc123" \
  --tag demo \
  --out ./dist/fix-auth-bundle
```

Config-driven:

```bash
npm run dev -- pack --config ./starter/taskbundle.config.json
```

`pack` also supports:
- automatic git metadata detection
- artifact hashes and sizes in `bundle.json`
- benchmark-style outcome fields such as `status`, `score`, and `judgeNotes`
- optional `.tar.gz` archive creation with `--archive`

### `taskbundle inspect`
Read a bundle directory and print a human-friendly summary:

```bash
npm run dev -- inspect ./examples/hello-world-bundle
```

Machine-readable JSON:

```bash
npm run dev -- inspect --json ./examples/hello-world-bundle
```

### `taskbundle compare`
Compare two bundles:

```bash
npm run dev -- compare ./examples/hello-world-bundle ./examples/hello-world-bundle-claude
```

JSON output:

```bash
npm run dev -- compare --json ./examples/hello-world-bundle ./examples/hello-world-bundle-claude
```

### `taskbundle archive`
Create a `.tar.gz` archive from a bundle directory:

```bash
npm run dev -- archive ./examples/hello-world-bundle --out ./dist/hello-world-bundle.tar.gz
```

### `taskbundle extract`
Extract a bundle archive into a directory:

```bash
npm run dev -- extract ./dist/hello-world-bundle.tar.gz --out ./dist/extracted
```

### `taskbundle validate`
Validate a bundle and check replay readiness:

```bash
npm run dev -- validate ./examples/hello-world-bundle
```

### `taskbundle scan`
Scan a directory for bundle folders:

```bash
npm run dev -- scan ./examples
```

## Example Bundles

The repository includes two real examples:
- [examples/hello-world-bundle](./examples/hello-world-bundle)
- [examples/hello-world-bundle-claude](./examples/hello-world-bundle-claude)

They represent the same task captured from different tool/model combinations so `compare` has something meaningful to show.

## Bundle Format At A Glance

- `bundle.json`: top-level metadata and artifact pointers
- `artifactInfo`: optional size/hash information for copied artifacts
- `task.md`: original task, constraints, and acceptance criteria
- `summary.md`: short human-readable execution outcome
- `result.diff`: final patch or diff
- `events.jsonl`: notable actions and turning points, not every token
- `workspace/manifest.json`: file list with paths, sizes, and hashes
- `workspace/files/`: captured task-related files
- `git`: optional git root / branch / remote / commit metadata
- `runner`: optional pack-time runtime metadata
- `outcome`: optional benchmark or judge result fields

## Local Development

### Install

```bash
npm install
```

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

### Full Check

```bash
npm run check
```

### Run the CLI

```bash
node dist/cli/index.js inspect ./examples/hello-world-bundle
```

Or use the development entrypoint:

```bash
npm run dev -- inspect ./examples/hello-world-bundle
```

## Project Structure

```txt
src/
  cli/
    commands/
  core/
  utils/
examples/
  hello-world-bundle/
  hello-world-bundle-claude/
docs/
  bundle-format.md
  bundle-format.zh-CN.md
  design-decisions.md
  replay-contract.md
```

## Known Limitations

- Archives currently use `.tar.gz`, not `.zip`.
- The project can compare metadata, scores, and artifact hashes, but it still does not judge semantic code quality on its own.
- Workspace capture still uses explicit copied file sets instead of repository-wide snapshot strategies.
- There is no viewer UI yet.

## Roadmap

See:
- [ROADMAP.md](./ROADMAP.md)
- [ROADMAP.zh-CN.md](./ROADMAP.zh-CN.md)
