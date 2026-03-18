# Branding Assets

This repository includes the visual assets used in the README and GitHub social preview.

## Files

- `assets/hero-banner.svg`
  Hero image used at the top of the README.
- `assets/workflow-overview.svg`
  Workflow diagram used in the README.
- `assets/audience-fit.svg`
  Audience card graphic used to show which teams Task Bundle is for.
- `assets/quick-demo.gif`
  Animated terminal walkthrough for the README quick start section.
- `assets/terminal-showcase.svg`
  Three-panel terminal preview used to show real inspect, compare, and report output.
- `assets/social-preview.svg`
  Source artwork for GitHub social preview uploads, showing compare output and a leaderboard snapshot.
- `assets/social-preview.png`
  Recommended raster export for GitHub social preview uploads.

## Suggested GitHub Setup

1. Open the repository settings page.
2. Go to `General` -> `Social preview`.
3. Upload `assets/social-preview.png`.

## Local Export Tips

The SVG files stay in the repository so they remain editable and easy to version.

You can regenerate the demo GIF with:

```bash
python3 ./scripts/generate_demo_gif.py
```
