# 品牌素材

这个仓库在 `assets/` 目录下提供了 README 和 GitHub 社交预览图会用到的视觉素材。

## 文件说明

- `assets/hero-banner.svg`
  README 顶部使用的主视觉横幅。
- `assets/workflow-overview.svg`
  README 中使用的工作流示意图。
- `assets/audience-fit.svg`
  README 中使用的受众卡片图，用来说明 Task Bundle 更适合哪些团队。
- `assets/quick-demo.gif`
  README 快速开始部分使用的动图演示。
- `assets/terminal-showcase.svg`
  README 中使用的终端展示图，用来展示 inspect、compare、report 的真实输出。
- `assets/sample-benchmark-avg-score.svg`
  示例 benchmark 平均分 badge，用来展示报告数据也可以反向挂回 README 或文档。
- `assets/sample-benchmark-success-rate.svg`
  示例 benchmark 成功率 badge。
- `assets/social-preview.svg`
  GitHub 社交预览图的可编辑源文件，里面会展示 compare 输出和 leaderboard 快照。
- `assets/social-preview.png`
  GitHub 社交预览图的 PNG 版本。

## 推荐设置

1. 打开仓库设置页。
2. 进入 `General` -> `Social preview`。
3. 上传 `assets/social-preview.png`。

## 重新导出 PNG

在 macOS 上可以直接运行：

```bash
sips -s format png ./assets/social-preview.svg --out ./assets/social-preview.png
```

仓库里保留 SVG，是为了继续编辑和版本管理更方便。

如果要重新生成演示 GIF，可以运行：

```bash
python3 ./scripts/generate_demo_gif.py
```

如果要重新生成示例 HTML 报告和 badge，可以运行：

```bash
npm run dev -- report ./examples --html-out ./docs/sample-benchmark-report.html
npm run dev -- badge ./examples --metric avg-score --out ./assets/sample-benchmark-avg-score.svg
npm run dev -- badge ./examples --metric success-rate --out ./assets/sample-benchmark-success-rate.svg
```
