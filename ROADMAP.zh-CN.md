# Task Bundle 路线图

Task Bundle 目前已经从一个小型 CLI MVP，走到了“可实际使用的打包与比较工具”这一步。下面这份路线图描述的是它接下来如何继续长成 replay / compare / benchmark 的基础设施。

## 当前状态

### v0.2
- 已完成：`pack --config`，starter 配置可直接消费
- 已完成：bundle metadata、workspace manifest、events 的 schema 校验
- 已完成：打包时自动采集 git 元数据
- 已完成：`compare` 命令
- 已完成：更丰富的 `compare` 输出，包括 artifact hash 差异和 score delta
- 已完成：`.tar.gz` 归档与解压命令
- 已完成：`validate` 与 `scan` 命令，用于 replay 校验和 bundle 集合扫描
- 已完成：artifact 哈希和大小写入 `bundle.json`
- 已完成：bundle metadata 中的 benchmark / judge 结果字段
- 已完成：CLI smoke tests 和 GitHub Actions CI
- 已完成：中英文文档

### v0.3
- 规划中：面向 benchmark 的结果字段和评分约定
- 规划中：多 bundle 目录扫描与批量比较
- 规划中：更多用于演示和 benchmark 的标准 example bundles

### v0.4
- 规划中：replay contract 校验工具，判断一个 bundle 是否具备重跑条件
- 规划中：跨工具批量执行同一批 bundle 的 runner
- 规划中：在 bundle 格式之上构建 viewer / benchmark playground

## 当前优先级

1. 先稳定 `0.2.x` 的格式，避免不必要的 schema 抖动。
2. 增加更多“同任务不同工具”的示例 bundle。
3. 先把 compare 做深，再考虑 UI。
