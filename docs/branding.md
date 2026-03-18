# Branding Assets

Task Bundle includes repository-ready visual assets under `assets/`.

The art direction is intentionally warm-editorial rather than generic SaaS gradients: a calm dark field, paper-toned bundle cards, and a benchmark signal accent that reinforces "portable tasks" plus "measurable outcomes."

## Files

- `assets/hero-banner.svg`
  Embedded at the top of the README to make the repository landing page feel like a product, not just a package listing.
- `assets/workflow-overview.svg`
  A second README visual that explains the capture -> inspect -> compare -> report loop in one glance.
- `assets/social-preview.svg`
  Source artwork for GitHub social preview uploads.
- `assets/social-preview.png`
  Recommended raster export for GitHub social preview uploads. Kept in the repository for easy manual upload, but not required in the npm package.

## Suggested GitHub Setup

1. Open the repository settings page.
2. Go to `General` -> `Social preview`.
3. Upload `assets/social-preview.png`.

## Local Export Tips

If you want to regenerate the PNG on macOS, you can use Quick Look or another SVG-to-PNG tool. The repository artwork is intentionally kept as SVG so it stays editable and versionable, while the committed PNG keeps GitHub social preview setup friction low.
