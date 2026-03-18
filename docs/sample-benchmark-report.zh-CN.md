# 示例 Benchmark 报告

这个页面展示的是：把仓库自带的 example bundles 交给 `taskbundle report` 之后，大概会得到什么样的结果。

## 本地重新生成

```bash
npm run dev -- report ./examples --out ./dist/benchmark-report.md
```

## 示例快照

- Bundles: 2
- Scored bundles: 2
- Average score: 0.91

## 排名

| Rank | Title | Tool | Model | Status | Score | Events | Workspace |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Fix greeting punctuation | codex | gpt-5 | success | 0.93 | 3 | 1 |
| 2 | Fix greeting punctuation | claude-code | claude-sonnet-4 | success | 0.89 | 4 | 1 |

## Tool / Model 排行

| Tool | Model | Runs | Scored | Successes | Avg Score | Best Score |
| --- | --- | --- | --- | --- | --- | --- |
| codex | gpt-5 | 1 | 1 | 1 | 0.93 | 0.93 |
| claude-code | claude-sonnet-4 | 1 | 1 | 1 | 0.89 | 0.89 |

## 为什么这个页面有价值

- 它让仓库直接具备一个 benchmark 风格的可见成果，不需要先做完整平台。
- 它说明 example bundles 不是摆设，而是真的可以继续拿来分析和比较。
- 它让“跨工具比较”在没有 dashboard 之前，也已经足够清楚可读。
