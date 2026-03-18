# Task Bundle Format

Task Bundle stores one AI coding task as a portable directory. The MVP uses plain files so bundles are easy to inspect, diff, copy, and version.

## Format Goals

A bundle should answer five questions:
- What was the task?
- What runtime, tool, and model metadata describe the run?
- What changed?
- What notable events happened during the run?
- What task-related files were captured for later replay or comparison?

## Directory Layout

```txt
task-bundle/
  bundle.json
  task.md
  summary.md
  events.jsonl
  result.diff
  workspace/
    manifest.json
    files/...
```

## Reading Order

When a human or tool inspects a bundle, the most useful order is:

1. `bundle.json`: quick metadata and artifact index
2. `task.md`: original task, constraints, and acceptance criteria
3. `summary.md`: human-readable result
4. `result.diff`: final code change
5. `events.jsonl`: notable actions and turning points
6. `workspace/manifest.json`: captured file index
7. `workspace/files/`: the actual file snapshot

## File Semantics

### `bundle.json`
Top-level metadata and pointers to artifacts in the bundle.

Recommended fields:
- `schemaVersion`
- `id`
- `title`
- `createdAt`
- `tool`
- `model`
- `runtime`
- `repo`
- `commit`
- `tags`
- `artifacts`

Example shape:

```json
{
  "schemaVersion": "0.1.0",
  "id": "hello-world-bundle",
  "title": "Fix greeting punctuation",
  "createdAt": "2026-03-18T00:00:00.000Z",
  "tool": "codex",
  "model": "gpt-5",
  "runtime": "node",
  "repo": "example/hello-world",
  "commit": "abc123",
  "tags": ["demo", "mvp"],
  "artifacts": {
    "task": "task.md",
    "summary": "summary.md",
    "diff": "result.diff",
    "events": "events.jsonl",
    "workspaceManifest": "workspace/manifest.json",
    "workspaceFilesDir": "workspace/files"
  }
}
```

### `task.md`
The original task description, constraints, and acceptance criteria.

### `summary.md`
A short execution summary with status, result, and key takeaways.

### `events.jsonl`
A high-signal event log. Capture meaningful steps such as reading files, running commands, hitting an error, or producing the final diff.

Each line should be one JSON object. A minimal event shape can be:

```json
{"type":"run_command","at":"2026-03-18T00:00:03.000Z","detail":"npm test"}
```

`events.jsonl` records notable actions and turning points, not every token or every intermediate state.

### `result.diff`
The final patch or diff produced by the task.

### `workspace/manifest.json`
A manifest of captured workspace files, including relative paths, hashes, and sizes.

Example shape:

```json
{
  "capturedAt": "2026-03-18T00:00:04.000Z",
  "root": "workspace/files",
  "fileCount": 1,
  "files": [
    {
      "path": "src/greet.ts",
      "sha256": "a890275b221931c2b0f03061f70c93f73f59f6a542b1f0b81f4507ebc86bc5c0",
      "size": 62
    }
  ]
}
```

### `workspace/files/`
A minimal file snapshot for the task. The MVP copies files into the bundle directly.

## Replay Meaning

Replay in Task Bundle means re-executable and comparable, not token-identical. A bundle should give another tool or model enough context to rerun the task against the same starting materials and compare outcomes.

## Compatibility Rules

- `schemaVersion` identifies the bundle format version.
- Consumers should ignore unknown fields so the format can evolve.
- `tool`, `model`, `runtime`, `repo`, `commit`, `diff`, `events`, and `workspace` artifacts are optional in the MVP.
- Artifact paths should remain inside the bundle directory.

## Future Evolution

The directory format leaves room for:
- zipped or tarred bundles
- richer event schemas
- viewer UIs
- benchmark runners that execute the same bundle across multiple tools
