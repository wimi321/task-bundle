# 示例 Benchmark 报告

这个页面保存了一份基于仓库示例 bundle 生成的 `taskbundle report` 输出，方便直接查看结果长什么样。

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

## 按工具 / 模型汇总

| Tool | Model | Runs | Scored | Successes | Avg Score | Best Score |
| --- | --- | --- | --- | --- | --- | --- |
| codex | gpt-5 | 1 | 1 | 1 | 0.93 | 0.93 |
| claude-code | claude-sonnet-4 | 1 | 1 | 1 | 0.89 | 0.89 |

## 为什么保留这个页面

- 让读者直接看到报告输出的样子。
- 说明仓库里的示例 bundle 可以继续拿来比较和分析。
- README 可以稳定链接到这份示例结果。
