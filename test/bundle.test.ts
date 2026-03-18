import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createBundle, createInitTemplate, inspectBundle, readBundle } from "../src/core/bundle";
import { pathExists } from "../src/utils/fs";

async function makeTempDir(prefix: string): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), prefix));
}

test("createInitTemplate writes starter inputs", async () => {
  const tempDir = await makeTempDir("taskbundle-init-");

  try {
    await createInitTemplate(tempDir);

    assert.equal(await pathExists(path.join(tempDir, "task.md")), true);
    assert.equal(await pathExists(path.join(tempDir, "summary.md")), true);
    assert.equal(await pathExists(path.join(tempDir, "events.jsonl")), true);
    assert.equal(await pathExists(path.join(tempDir, "result.diff")), true);
    assert.equal(await pathExists(path.join(tempDir, "workspace-files", "src", "app.ts")), true);

    const starterReadme = await readFile(path.join(tempDir, "README.md"), "utf8");
    assert.match(starterReadme, /npm run dev -- pack/);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("createBundle packs files into a standard bundle directory", async () => {
  const tempDir = await makeTempDir("taskbundle-pack-");
  const starterDir = path.join(tempDir, "starter");
  const outputDir = path.join(tempDir, "bundle");

  try {
    await createInitTemplate(starterDir);

    const metadata = await createBundle({
      title: "Starter bundle",
      taskPath: path.join(starterDir, "task.md"),
      summaryPath: path.join(starterDir, "summary.md"),
      diffPath: path.join(starterDir, "result.diff"),
      eventsPath: path.join(starterDir, "events.jsonl"),
      workspacePath: path.join(starterDir, "workspace-files"),
      outputDir,
      tool: "codex",
      model: "gpt-5",
      runtime: "node",
      repo: "owner/repo",
      commit: "abc123",
      tags: ["test"]
    });

    assert.equal(metadata.title, "Starter bundle");
    assert.equal(await pathExists(path.join(outputDir, "bundle.json")), true);
    assert.equal(await pathExists(path.join(outputDir, "workspace", "manifest.json")), true);
    assert.equal(await pathExists(path.join(outputDir, "workspace", "files", "src", "app.ts")), true);

    const bundle = await readBundle(outputDir);
    assert.equal(bundle.metadata.tool, "codex");
    assert.equal(bundle.workspaceManifest?.fileCount, 1);
    assert.match(bundle.task, /# Task/);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("inspectBundle returns human and machine readable summary fields", async () => {
  const inspection = await inspectBundle(
    "/Users/haoc/Developer/task-bundle/examples/hello-world-bundle"
  );

  assert.equal(inspection.title, "Fix greeting punctuation");
  assert.equal(inspection.schemaVersion, "0.1.0");
  assert.equal(inspection.workspaceFileCount, 1);
  assert.equal(inspection.eventCount, 3);
  assert.deepEqual(inspection.tags, ["demo", "mvp"]);
  assert.ok(inspection.artifacts.includes("bundle.json"));
});

test("createBundle removes stale files from a previous output directory", async () => {
  const tempDir = await makeTempDir("taskbundle-clean-");
  const starterDir = path.join(tempDir, "starter");
  const outputDir = path.join(tempDir, "bundle");

  try {
    await createInitTemplate(starterDir);
    await createBundle({
      title: "First pass",
      taskPath: path.join(starterDir, "task.md"),
      summaryPath: path.join(starterDir, "summary.md"),
      outputDir
    });

    await writeFile(path.join(outputDir, "stale.txt"), "old content\n", "utf8");
    assert.equal(await pathExists(path.join(outputDir, "stale.txt")), true);

    await createBundle({
      title: "Second pass",
      taskPath: path.join(starterDir, "task.md"),
      summaryPath: path.join(starterDir, "summary.md"),
      outputDir
    });

    assert.equal(await pathExists(path.join(outputDir, "stale.txt")), false);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("readBundle rejects artifact paths that escape the bundle directory", async () => {
  const tempDir = await makeTempDir("taskbundle-escape-");

  try {
    await createInitTemplate(tempDir);
    await createBundle({
      title: "Escape test",
      taskPath: path.join(tempDir, "task.md"),
      summaryPath: path.join(tempDir, "summary.md"),
      outputDir: path.join(tempDir, "bundle")
    });

    const bundleJsonPath = path.join(tempDir, "bundle", "bundle.json");
    const bundleJson = JSON.parse(await readFile(bundleJsonPath, "utf8")) as {
      artifacts: { task: string; summary: string };
    };
    bundleJson.artifacts.task = "../task.md";

    await import("../src/utils/fs").then(({ writeJsonFile }) => writeJsonFile(bundleJsonPath, bundleJson));

    await assert.rejects(readBundle(path.join(tempDir, "bundle")), /escapes bundle directory/);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
