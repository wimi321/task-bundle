# Use Cases

Task Bundle is most useful when you already have real coding runs and want a lightweight way to keep them inspectable, comparable, and reusable.

## 1. Save a run for later review

If an AI coding session ends as a patch, transcript, and a half-remembered prompt, it is hard to revisit later.

Task Bundle gives you a stable directory with:
- the original task
- a short summary
- event history
- the resulting diff
- workspace files

That makes it easier to review what happened a day or a month later.

## 2. Compare tools on the same task

If you want to compare Codex, Claude Code, Cursor, or an internal tool, you usually need more than screenshots.

Task Bundle lets you keep:
- tool and model metadata
- artifact hashes
- outcome fields such as status and score
- a comparable workspace snapshot

That gives `compare` and `report` something real to work with.

## 3. Build a benchmark collection gradually

Not every team wants to start by building a full benchmark platform.

Task Bundle works well as an intermediate step:
- package runs as they happen
- keep them in one directory
- scan and report over the collection later

This is often enough to validate whether deeper benchmark tooling is even worth building.

## 4. Hand tasks to another teammate or tool

Sometimes the next step is not analysis. It is handoff.

Because the task, artifacts, and workspace snapshot live together, another person or tool can pick up the same bundle and continue from a clearer starting point.

## A Good Fit

Task Bundle is a good fit if:
- chat logs feel too loose
- zip files feel too unstructured
- a full eval platform feels too heavy

## Not The Best Fit

Task Bundle is probably not the right tool if:
- you need a hosted benchmark product
- you need a chat interface
- you need token-perfect capture of every prompt and response
