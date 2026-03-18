# Sample Benchmark Report

This page shows what `taskbundle report` looks like against the example bundles included in this repository.

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

## Why This Matters

- It gives the repo a benchmark-shaped artifact without forcing a full benchmark platform.
- It shows that the example bundles are not toy files with no downstream use.
- It makes cross-tool comparisons legible for humans before you build dashboards.
