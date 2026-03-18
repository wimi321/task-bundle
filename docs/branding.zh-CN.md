# 品牌素材

这个仓库在 `assets/` 目录下提供了 README 和 GitHub 社交预览图会用到的视觉素材。

## 文件说明

- `assets/hero-banner.svg`
  README 顶部使用的主视觉横幅。
- `assets/workflow-overview.svg`
  README 中使用的工作流示意图。
- `assets/terminal-showcase.svg`
  README 中使用的终端展示图，用来展示 inspect、compare、report 的真实输出。
- `assets/social-preview.svg`
  GitHub 社交预览图的可编辑源文件。
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
