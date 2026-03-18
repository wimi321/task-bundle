# Task Bundle

[English](./README.md) | [简体中文](./README.zh-CN.md)

Task Bundle 是一个小而真的 TypeScript + Node.js CLI，用来把一次 AI coding 任务打包成一个可移植目录。

它适合这些场景：
- 查看一次任务最后到底做了什么
- 把任务结果分享给别人
- 在之后重新执行同一个任务
- 比较不同模型或工具在同一起点上的表现

这个 MVP 目前只聚焦目录型 bundle 和三个命令：`init`、`pack`、`inspect`。

它明确不做这些事情：
- agent 框架
- 聊天 UI
- provider 路由器
- benchmark 平台
- token 级逐步录制器

## 这里的 Replay 是什么意思

Task Bundle 里的 replay 指的是“可重新执行、可比较”，不是“逐帧复刻”。

目标不是把每一步 prompt、每一个 token 都原样重放，而是在相同任务描述、相同初始材料、相近元数据条件下，让任务可以再次执行，并能和其他模型、工具或后续版本做比较。

## Bundle 目录结构

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

完整格式说明见 [docs/bundle-format.zh-CN.md](./docs/bundle-format.zh-CN.md)。

## 五分钟演示

1. 安装依赖并构建：

```bash
npm install
npm run build
```

2. 查看仓库自带的示例 bundle：

```bash
npm run dev -- inspect ./examples/hello-world-bundle
```

3. 生成你自己的 starter 输入目录：

```bash
npm run dev -- init --out ./starter
```

4. 把这些输入打包成一个新的 bundle：

```bash
npm run dev -- pack \
  --title "我的第一个 bundle" \
  --task ./starter/task.md \
  --summary ./starter/summary.md \
  --diff ./starter/result.diff \
  --events ./starter/events.jsonl \
  --workspace ./starter/workspace-files \
  --out ./dist/my-first-bundle
```

5. 再次 inspect 你刚生成的 bundle：

```bash
npm run dev -- inspect ./dist/my-first-bundle
```

## 命令说明

### `taskbundle init`
生成一个新的 task bundle starter 输入目录：

```bash
npm run dev -- init --out ./starter
```

它会写出这些文件：
- `task.md`
- `summary.md`
- `events.jsonl`
- `result.diff`
- `workspace-files/`
- `README.md`

### `taskbundle pack`
把任务输入整理成标准 bundle 目录：

```bash
npm run dev -- pack \
  --title "Fix auth bug" \
  --task ./starter/task.md \
  --summary ./starter/summary.md \
  --diff ./starter/result.diff \
  --events ./starter/events.jsonl \
  --workspace ./starter/workspace-files \
  --tool "codex" \
  --model "gpt-5" \
  --runtime "node" \
  --repo "owner/repo" \
  --commit "abc123" \
  --tag demo \
  --out ./dist/fix-auth-bundle
```

### `taskbundle inspect`
读取一个 bundle 目录并打印人类可读摘要：

```bash
npm run dev -- inspect ./examples/hello-world-bundle
```

也支持机器可读 JSON：

```bash
npm run dev -- inspect --json ./examples/hello-world-bundle
```

输出大致会像这样：

```txt
Task Bundle
-----------
Title: Fix greeting punctuation
Schema: 0.1.0
Created: 2026-03-18T00:00:00.000Z
Tool: codex
Model: gpt-5
Runtime: node
Repo: example/hello-world
Commit: abc123
Tags: demo, mvp

Artifacts:
- bundle.json
- events.jsonl
- result.diff
- summary.md
- task.md
- workspace

Workspace files: 1
Events: 3
```

## 示例 Bundle

仓库里自带了一个真实示例：[examples/hello-world-bundle](./examples/hello-world-bundle)。

你可以用它来：
- 立即 inspect 一个完整 bundle
- 理解目录结构
- 看清 task、summary、events、diff 和 workspace snapshot 是怎么组合在一起的

## Bundle 格式一眼看懂

- `bundle.json`：顶层元数据和 artifact 索引
- `task.md`：原始任务描述、约束和验收标准
- `summary.md`：人类可读的执行结果摘要
- `result.diff`：最终 patch / diff
- `events.jsonl`：关键动作和转折点，不记录每个 token
- `workspace/manifest.json`：文件路径、大小、哈希等清单
- `workspace/files/`：捕获到的任务相关文件

更完整的格式说明见 [docs/bundle-format.zh-CN.md](./docs/bundle-format.zh-CN.md)。

## 本地开发

### 安装

```bash
npm install
```

### 构建

```bash
npm run build
```

### 测试

```bash
npm test
```

### 运行 CLI

```bash
node dist/cli/index.js inspect ./examples/hello-world-bundle
```

或者直接用开发入口：

```bash
npm run dev -- inspect ./examples/hello-world-bundle
```

## 项目结构

```txt
src/
  cli/
    commands/
  core/
  utils/
examples/
  hello-world-bundle/
docs/
  bundle-format.md
  bundle-format.zh-CN.md
```

## 当前限制

- MVP 目前只支持目录型 bundle
- 事件日志刻意保持轻量，不记录 token 级过程
- workspace 捕获目前直接复制用户提供的文件集合，不自动探测 git 状态
- 还没有 remote execution、provider 集成或 viewer UI

## 为什么它还能继续长

这个结构现在很简单，但已经给后续扩展留好了空间：
- session viewer
- benchmark runner
- tar / zip 等打包格式
- 更丰富的 metadata 和 event schema

## 下一步值得做什么

1. 给 bundle 内容加 schema validation。
2. 支持直接从 git diff 和 commit 元数据打包。
3. 增加 CLI smoke test。
4. 增加 zip 导出和导入。
