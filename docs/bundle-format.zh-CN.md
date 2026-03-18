# Task Bundle 格式说明

Task Bundle 用一个可移植目录来表示一次 AI coding 任务。MVP 版本使用普通文件，而不是复杂压缩格式，这样 bundle 更容易阅读、比较、复制和版本管理。

## 格式目标

一个 bundle 应该能回答这五个问题：
- 任务是什么
- 这次运行的工具、模型、运行时元数据是什么
- 最后改了什么
- 过程中发生了哪些关键事件
- 为后续 replay 或对比捕获了哪些任务相关文件

## 目录结构

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

## 推荐阅读顺序

对于人类或工具来说，最有用的读取顺序通常是：

1. `bundle.json`：先看元数据和 artifact 索引
2. `task.md`：看原始任务、约束和验收标准
3. `summary.md`：看最终结论
4. `result.diff`：看最终代码改动
5. `events.jsonl`：看关键动作和转折点
6. `workspace/manifest.json`：看捕获到的文件索引
7. `workspace/files/`：看实际的文件内容

## 文件语义

### `bundle.json`
顶层元数据文件，同时也是 bundle 内其他产物的索引。

推荐字段：
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

示例：

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

在 `0.2.x` 及之后版本里，`artifactInfo` 是推荐但非强制的字段。它可以记录 artifact 的大小和哈希，方便校验与对比。

### `task.md`
原始任务描述，通常还会包含约束和验收标准。

### `summary.md`
简短的执行摘要，说明结果、状态和关键结论。

### `events.jsonl`
高信号事件日志，用来记录关键步骤，比如读取文件、执行命令、遇到错误、产出最终 diff。

每一行都应该是一个 JSON 对象，最小形态可以是：

```json
{"type":"run_command","at":"2026-03-18T00:00:03.000Z","detail":"npm test"}
```

`events.jsonl` 记录的是重要动作和转折点，不是每个 token、也不是每个中间状态。

### `result.diff`
任务最终得到的 patch / diff。

### `workspace/manifest.json`
记录捕获到的 workspace 文件清单，包含相对路径、哈希和大小。

示例：

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
任务相关文件的最小快照。MVP 版本直接把文件复制进 bundle。

### `git`
可选的 git 上下文字段，通常在 pack 时自动采集，例如 repo root、remote URL、branch、commit。

### `runner`
可选的运行器元数据，例如操作系统、Node.js 版本、CLI 版本、prompt 来源。

### `outcome`
可选的结果字段，为后续 benchmark 与 judge 流程预留。

## Replay 的含义

Task Bundle 里的 replay 指的是“可重新执行、可比较”，不是 token-identical 的逐帧复刻。一个 bundle 应该能给另一个工具或模型足够上下文，让它基于相同起点再次执行同一个任务，并和别的结果做比较。

## 兼容性规则

- `schemaVersion` 用来标识 bundle 格式版本
- 读取方应该忽略未知字段，这样格式才能平滑演进
- 在 MVP 里，`tool`、`model`、`runtime`、`repo`、`commit`、`diff`、`events`、`workspace` 都允许缺省
- `artifactInfo`、`git`、`runner`、`outcome` 都是可选扩展字段
- artifact 路径必须留在 bundle 目录内部

## 未来演进方向

当前目录格式为后续这些扩展留出了空间：
- zip / tar 等压缩格式
- 更丰富的 event schema
- viewer UI
- 在多个工具之间执行同一 bundle 的 benchmark runner
