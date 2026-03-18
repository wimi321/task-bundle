# Task Bundle

Task Bundle is a small TypeScript + Node.js CLI for packaging one AI coding task into a portable directory.

It is built for workflows where you want to:
- inspect what happened
- share a task with someone else
- rerun the task later
- compare how different models or tools perform on the same starting point

This MVP focuses on a directory-based bundle format and three commands: `init`, `pack`, and `inspect`.

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

See [docs/bundle-format.md](./docs/bundle-format.md) for the format details.

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

3. Generate starter inputs for your own task:

```bash
npm run dev -- init --out ./starter
```

4. Pack those inputs into a new bundle:

```bash
npm run dev -- pack \
  --title "My first bundle" \
  --task ./starter/task.md \
  --summary ./starter/summary.md \
  --diff ./starter/result.diff \
  --events ./starter/events.jsonl \
  --workspace ./starter/workspace-files \
  --out ./dist/my-first-bundle
```

5. Inspect the bundle you just created:

```bash
npm run dev -- inspect ./dist/my-first-bundle
```

## Commands

### `taskbundle init`
Create starter inputs for a new bundle:

```bash
npm run dev -- init --out ./starter
```

This writes:
- `task.md`
- `summary.md`
- `events.jsonl`
- `result.diff`
- `workspace-files/`
- `README.md`

### `taskbundle pack`
Build a bundle directory from task artifacts:

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

### `taskbundle inspect`
Read a bundle directory and print a human-friendly summary:

```bash
npm run dev -- inspect ./examples/hello-world-bundle
```

Or print machine-readable JSON:

```bash
npm run dev -- inspect --json ./examples/hello-world-bundle
```

Expected output shape:

```txt
Task Bundle
-----------
Title: Fix greeting punctuation
Schema: 0.1.0
Created: 2026-03-18T00:00:00.000Z
Tool: codex
Model: gpt-5
Runtime: node
Repo: example/hello-world
Commit: abc123
Tags: demo, mvp

Artifacts:
- bundle.json
- events.jsonl
- result.diff
- summary.md
- task.md
- workspace

Workspace files: 1
Events: 3
```

## Example Bundle

The repository includes a real example at [examples/hello-world-bundle](./examples/hello-world-bundle).

You can use it to:
- inspect a complete bundle immediately
- understand the directory structure
- see how task, summary, events, diff, and workspace snapshot fit together

## Bundle Format At A Glance

- `bundle.json`: top-level metadata and pointers to artifacts
- `task.md`: original task, constraints, and acceptance criteria
- `summary.md`: short human-readable execution outcome
- `result.diff`: final patch or diff
- `events.jsonl`: notable actions and turning points, not every token
- `workspace/manifest.json`: file list with paths, sizes, and hashes
- `workspace/files/`: captured task-related files

Full format details live in [docs/bundle-format.md](/Users/haoc/Developer/task-bundle/docs/bundle-format.md).

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
docs/
  bundle-format.md
```

## Known Limitations

- The MVP stores bundles as plain directories only.
- Event logs are intentionally lightweight and not token-level recordings.
- Workspace capture copies a provided file set directly; it does not detect repo state automatically.
- There is no remote execution, provider integration, or viewer UI yet.

## Why This Can Grow

This structure is intentionally simple, but it leaves clear room for:
- a session viewer
- benchmark runners
- alternate bundle transports like tar or zip
- richer metadata and event schemas

## Next Worthwhile Steps

1. Add schema validation for bundle contents.
2. Support packing directly from a git diff and commit metadata.
3. Add CLI smoke tests once dependency installation is available.
4. Add zip export and import.
