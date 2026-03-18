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
- `branch`
- `tags`
- `artifacts`
- `artifactInfo`
- `git`
- `runner`
- `outcome`

Example shape:

```json
{
  "schemaVersion": "0.2.0",
  "id": "hello-world-bundle",
  "title": "Fix greeting punctuation",
  "createdAt": "2026-03-18T00:00:00.000Z",
  "tool": "codex",
  "model": "gpt-5",
  "runtime": "node",
  "repo": "example/hello-world",
  "commit": "abc123",
  "branch": "main",
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

`artifactInfo` is optional but recommended in `0.2.x` and later. It records artifact sizes and hashes so bundles can be validated and compared more reliably.

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

### `git`
Optional git context captured at pack time, such as repo root, remote URL, branch, and commit.

### `runner`
Optional runner metadata such as operating system, Node.js version, CLI version, or prompt source.

### `outcome`
Optional result metadata reserved for future benchmark and judging workflows.

## Replay Meaning

Replay in Task Bundle means re-executable and comparable, not token-identical. A bundle should give another tool or model enough context to rerun the task against the same starting materials and compare outcomes.

## Compatibility Rules

- `schemaVersion` identifies the bundle format version.
- Consumers should ignore unknown fields so the format can evolve.
- `tool`, `model`, `runtime`, `repo`, `commit`, `diff`, `events`, and `workspace` artifacts are optional in the MVP.
- `artifactInfo`, `git`, `runner`, and `outcome` are optional extension fields.
- Artifact paths should remain inside the bundle directory.

## Future Evolution

The directory format leaves room for:
- zipped or tarred bundles
- richer event schemas
- viewer UIs
- benchmark runners that execute the same bundle across multiple tools
