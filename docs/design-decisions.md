# Design Decisions

## Directory First

Task Bundle uses a plain directory format first. This keeps the MVP easy to inspect, diff, copy, and version. Archive support is layered on top instead of replacing the directory layout.

## Replay Means Re-executable, Not Token-identical

The project does not try to recreate every intermediate prompt or token. A bundle should preserve enough context to rerun a task from the same starting point and compare outcomes across tools.

## High-signal Events Over Full Recording

`events.jsonl` captures notable actions and turning points. This keeps bundles useful without turning them into fragile or oversized session recordings.

## Captured File Sets Over Full Repository Mirroring

The MVP copies a task-related workspace file set into `workspace/files/`. This is enough to power comparisons and future replay experiments without forcing a heavyweight repository snapshot strategy on every bundle.

## Minimal Dependencies

The CLI favors Node.js built-ins and a small dependency surface. This keeps the tool portable and easier to publish.
