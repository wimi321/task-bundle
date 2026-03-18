# 品牌素材

Task Bundle 在 `assets/` 目录下提供了一套可直接用于仓库展示的视觉素材，让 README、GitHub 首页和分享卡片能保持统一气质。

## 文件说明

- `assets/hero-banner.svg`
  中英文 README 顶部使用的主视觉横幅，可继续编辑。
- `assets/workflow-overview.svg`
  README 里的第二张主视觉，用来一眼解释 capture -> inspect -> compare -> report 这条路径。
- `assets/social-preview.svg`
  GitHub 社交预览图的可编辑源文件。
- `assets/social-preview.png`
  已导出的上传版本，适合直接放到 GitHub 仓库设置里。

## 推荐设置

1. 打开仓库设置页。
2. 进入 `General` -> `Social preview`。
3. 上传 `assets/social-preview.png`。

## 重新导出 PNG

在 macOS 上可以直接运行：

```bash
sips -s format png ./assets/social-preview.svg --out ./assets/social-preview.png
```

仓库里保留 SVG，是为了让这套素材更容易继续修改、做版本对比，也更适合长期维护。
