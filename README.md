# Task Bundle

[English](./README.md) | [简体中文](./README.zh-CN.md)

<p align="center">
  <img src="./assets/hero-banner.svg" alt="Task Bundle hero banner" width="100%" />
</p>

<p align="center"><strong>Turn AI coding runs into portable, replayable task bundles.</strong></p>
<p align="center">Useful when chat logs are too loose and full benchmark platforms are more than you need.</p>
<p align="center">
  <a href="#quickstart"><strong>Quick Start</strong></a> ·
  <a href="#example-output"><strong>Example Output</strong></a> ·
  <a href="#where-it-fits"><strong>Where It Fits</strong></a> ·
  <a href="./docs/bundle-format.md"><strong>Bundle Format</strong></a> ·
  <a href="./docs/sample-benchmark-report.md"><strong>Sample Report</strong></a> ·
  <a href="./ROADMAP.md"><strong>Roadmap</strong></a>
</p>

[![CI](https://github.com/wimi321/task-bundle/actions/workflows/ci.yml/badge.svg)](https://github.com/wimi321/task-bundle/actions/workflows/ci.yml)
[![GitHub stars](https://img.shields.io/github/stars/wimi321/task-bundle?style=social)](https://github.com/wimi321/task-bundle/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Task Bundle is a TypeScript + Node.js CLI for packaging one coding task into a directory you can inspect, compare, archive, validate, and report on.

Use it to:
- keep task inputs, summaries, diffs, events, and workspace files together
- compare Codex, Claude Code, Cursor, or internal tools using metadata, hashes, and outcome fields
- generate benchmark-style reports from a folder of bundles
- preserve enough context for reruns without aiming for token-perfect replay

Reach for it when you want to:
- inspect what happened
- share a task with someone else
- rerun a task later
- compare outputs across tools and models
- grow toward replay and benchmark workflows

It is not:
- an agent framework
- a chat UI
- a provider router
- a benchmark platform
- a token-by-token recorder

<a id="quickstart"></a>

## Quick Start

Run the repo against real example bundles in about a minute:

```bash
npm install
npm run build
npm run dev -- compare ./examples/hello-world-bundle ./examples/hello-world-bundle-claude
```

This is the fastest way to see the format in action.

![Task Bundle workflow overview](./assets/workflow-overview.svg)

<a id="example-output"></a>

## Example Output

Inspect a bundle:

```text
$ npm run dev -- inspect ./examples/hello-world-bundle
Task Bundle
-----------
Title: Fix greeting punctuation
Tool: codex
Model: gpt-5
Status: success
Score: 0.93
Workspace files: 1
Events: 3
```

Compare two tools on the same task:

```text
$ npm run dev -- compare ./examples/hello-world-bundle ./examples/hello-world-bundle-claude
Task Bundle Comparison
----------------------
Left tool: codex
Right tool: claude-code
Left score: 0.93
Right score: 0.89
Score delta: 0.04
Workspace file delta: 0
Event count delta: -1
```

Generate a benchmark-style summary from a directory of runs:

```text
$ npm run dev -- report ./examples --out ./dist/benchmark-report.md
Bundles: 2
Average score: 0.91

Ranking
1. Fix greeting punctuation | codex / gpt-5 | success | score 0.93
2. Fix greeting punctuation | claude-code / claude-sonnet-4 | success | score 0.89
```

See the committed sample report:
- [docs/sample-benchmark-report.md](./docs/sample-benchmark-report.md)
- [docs/sample-benchmark-report.zh-CN.md](./docs/sample-benchmark-report.zh-CN.md)

<a id="where-it-fits"></a>

## Where It Fits

| Need | Chat logs | Zip or tarball | Full benchmark platform | Task Bundle |
| --- | --- | --- | --- | --- |
| Share the original task and result together | Partial | Yes | Yes | Yes |
| Compare different tools on the same starting point | Weak | Manual | Yes | Yes |
| Carry artifact hashes and outcome metadata | No | No | Yes | Yes |
| Stay lightweight enough for everyday coding workflows | Yes | Yes | No | Yes |
| Grow into replay and benchmark workflows later | Weak | Weak | Yes | Yes |

## Why It Matters

Most AI coding work disappears into screenshots, transcripts, or one-off patches.

Task Bundle gives you a stable task artifact you can inspect, archive, compare, validate, and report on. That makes it useful for:
- agent builders who want reproducible tasks
- eval and benchmark authors who need structured task artifacts
- teams comparing Codex, Claude Code, Cursor, or custom tools
- researchers who care about re-execution over token-perfect replay

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

6. Generate a benchmark report:

```bash
npm run dev -- report ./examples --out ./dist/benchmark-report.md
```

7. Generate starter inputs:

```bash
npm run dev -- init --out ./starter
```

8. Pack from the generated config:

```bash
npm run dev -- pack --config ./starter/taskbundle.config.json
```

9. Archive the result:

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

### `taskbundle report`
Generate a benchmark-style ranking and optional Markdown report:

```bash
npm run dev -- report ./examples --out ./dist/benchmark-report.md
```

## Example Bundles

The repository includes two real examples:
- [examples/hello-world-bundle](./examples/hello-world-bundle)
- [examples/hello-world-bundle-claude](./examples/hello-world-bundle-claude)

They represent the same task captured from different tool/model combinations so `compare` has something meaningful to show.

You can also point `taskbundle report` at the same directory to generate a small benchmark-style leaderboard.

For a committed snapshot of that output, see [docs/sample-benchmark-report.md](./docs/sample-benchmark-report.md).

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
