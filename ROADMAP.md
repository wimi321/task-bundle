# Task Bundle Roadmap

Task Bundle started as a small CLI MVP. This roadmap turns it into a practical foundation for replayable and comparable AI coding tasks.

## Status

### v0.2
- Done: `pack --config` with starter config support
- Done: schema validation for bundle metadata, workspace manifests, and event logs
- Done: automatic git metadata detection during packing
- Done: `compare` command
- Done: richer `compare` output with artifact hash differences and score deltas
- Done: `archive` and `extract` commands for `.tar.gz` bundles
- Done: `validate` and `scan` commands for replay checks and bundle collections
- Done: artifact hashes and sizes in `bundle.json`
- Done: benchmark-style outcome fields in bundle metadata
- Done: CLI smoke tests and GitHub Actions CI
- Done: Chinese and English documentation

### v0.3
- Planned: machine-readable benchmark result fields and scoring conventions
- Planned: bundle collections and directory scans for multi-run comparisons
- Planned: more curated example bundles for benchmark-style demos

### v0.4
- Planned: replay contract tooling that validates whether a bundle is runnable
- Planned: batch runner support for executing many bundles across tools
- Planned: session viewer or benchmark playground on top of the bundle format

## Current Priorities

1. Stabilize the format around `0.2.x` and avoid unnecessary schema churn.
2. Add more examples that show the same task solved by different tools.
3. Add deeper comparison features before expanding into UI.
