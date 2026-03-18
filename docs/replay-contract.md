# Replay Contract

Task Bundle replay means re-execution under comparable starting conditions.

## Minimum Replay Inputs

A bundle is considered replay-ready when it contains:
- `task.md` with the task description and constraints
- `summary.md` from the original run
- a stable `bundle.json` metadata record
- a task-related file snapshot in `workspace/files/` or a clearly referenced starting state
- optional but recommended `events.jsonl`
- optional but recommended `result.diff`

## Minimum Metadata

These metadata fields are the most important for replayability:
- `schemaVersion`
- `title`
- `createdAt`
- `tool`
- `model`
- `runtime`
- `repo`
- `commit`
- `branch`

## Replay Expectations

Replay is successful when a tool can:
- understand the original task
- access equivalent starting files
- rerun the task under similar runtime assumptions
- produce a new result that can be compared with the original bundle

Replay is not expected to:
- reproduce token streams exactly
- preserve the exact same event timing
- recreate every internal branch or hidden reasoning step
