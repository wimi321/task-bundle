# Sample Benchmark Report

This page keeps a saved example of `taskbundle report` generated from the example bundles in this repository.

## Regenerate Locally

```bash
npm run dev -- report ./examples --out ./dist/benchmark-report.md
```

## Snapshot

- Bundles: 2
- Scored bundles: 2
- Average score: 0.91

## Ranking

| Rank | Title | Tool | Model | Status | Score | Events | Workspace |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Fix greeting punctuation | codex | gpt-5 | success | 0.93 | 3 | 1 |
| 2 | Fix greeting punctuation | claude-code | claude-sonnet-4 | success | 0.89 | 4 | 1 |

## Leaderboard By Tool/Model

| Tool | Model | Runs | Scored | Successes | Avg Score | Best Score |
| --- | --- | --- | --- | --- | --- | --- |
| codex | gpt-5 | 1 | 1 | 1 | 0.93 | 0.93 |
| claude-code | claude-sonnet-4 | 1 | 1 | 1 | 0.89 | 0.89 |

## Why Keep This Page

- It gives readers a concrete example of the report output.
- It shows how the example bundles can be compared without extra tooling.
- It provides a stable link that can be referenced from the README.
