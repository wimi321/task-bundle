import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { createBundle, createInitTemplate, inspectBundle, readBundle } from "../src/core/bundle";
import { renderBenchmarkBadge } from "../src/core/badge";
import { compareBundles } from "../src/core/compare";
import {
  generateBenchmarkReport,
  renderBenchmarkReportHtml,
  renderBenchmarkReportMarkdown
} from "../src/core/report";
import { pathExists } from "../src/utils/fs";

const execFileAsync = promisify(execFile);

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
    assert.equal(await pathExists(path.join(tempDir, "taskbundle.config.json")), true);
    assert.equal(await pathExists(path.join(tempDir, "workspace-files", "src", "app.ts")), true);

    const starterReadme = await readFile(path.join(tempDir, "README.md"), "utf8");
    assert.match(starterReadme, /taskbundle\.config\.json/);
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
  assert.equal(inspection.schemaVersion, "0.2.0");
  assert.equal(inspection.workspaceFileCount, 1);
  assert.equal(inspection.eventCount, 3);
  assert.deepEqual(inspection.tags, ["demo", "mvp"]);
  assert.ok(inspection.artifacts.includes("bundle.json"));
  assert.ok(inspection.artifactInfo.task);
  assert.equal(inspection.outcome?.status, "success");
  assert.equal(inspection.outcome?.score, 0.93);
  assert.equal(inspection.promptSource, "cli");
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

test("compareBundles reports expected deltas", async () => {
  const comparison = await compareBundles(
    "/Users/haoc/Developer/task-bundle/examples/hello-world-bundle",
    "/Users/haoc/Developer/task-bundle/examples/hello-world-bundle-claude"
  );

  assert.equal(comparison.sameTitle, true);
  assert.equal(comparison.sameCommit, false);
  assert.deepEqual(comparison.artifactDelta.onlyInLeft, []);
  assert.deepEqual(comparison.artifactDelta.onlyInRight, []);
  assert.equal(comparison.counts.eventCountDelta, -1);
  assert.equal(comparison.modelChange.right, "claude-sonnet-4");
  assert.ok(Math.abs((comparison.outcomeChange.scoreDelta ?? 0) - 0.04) < 1e-9);
  assert.equal(comparison.artifactChanges.some((artifact) => artifact.artifact === "summary" && !artifact.sameHash), true);
});

test("pack config with git auto captures git metadata", async () => {
  const tempDir = await makeTempDir("taskbundle-git-auto-");

  try {
    await createInitTemplate(tempDir);

    await execFileAsync("git", ["init", "-b", "main"], { cwd: tempDir });
    await execFileAsync("git", ["config", "user.name", "Task Bundle Test"], { cwd: tempDir });
    await execFileAsync("git", ["config", "user.email", "taskbundle@example.com"], { cwd: tempDir });
    await execFileAsync("git", ["remote", "add", "origin", "https://github.com/example/task-bundle-test.git"], {
      cwd: tempDir
    });
    await execFileAsync("git", ["add", "."], { cwd: tempDir });
    await execFileAsync("git", ["commit", "-m", "Initial test commit"], { cwd: tempDir });

    const { stdout } = await execFileAsync(
      "node",
      [
        "--import",
        "tsx",
        "/Users/haoc/Developer/task-bundle/src/cli/index.ts",
        "pack",
        "--config",
        path.join(tempDir, "taskbundle.config.json")
      ],
      { cwd: "/Users/haoc/Developer/task-bundle" }
    );

    assert.match(stdout, /Created bundle at/);

    const bundle = await readBundle(path.join(tempDir, "bundle-output"));
    assert.equal(bundle.metadata.repo, "https://github.com/example/task-bundle-test.git");
    assert.equal(bundle.metadata.branch, "main");
    assert.ok(bundle.metadata.commit);
    assert.equal(bundle.metadata.outcome?.status, "success");
    assert.equal(bundle.metadata.outcome?.score, 1);
    assert.equal(bundle.metadata.runner?.promptSource, "config");
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("generateBenchmarkReport ranks bundles and produces markdown and html", async () => {
  const report = await generateBenchmarkReport("/Users/haoc/Developer/task-bundle/examples");

  assert.equal(report.bundleCount >= 2, true);
  assert.equal(report.ranking[0]?.model, "gpt-5");
  assert.equal(report.ranking[1]?.model, "claude-sonnet-4");
  assert.ok(Math.abs((report.averageScore ?? 0) - 0.91) < 1e-9);
  assert.equal(report.leaderboard[0]?.bestScore, 0.93);

  const markdown = renderBenchmarkReportMarkdown(report);
  assert.match(markdown, /# Benchmark Report/);
  assert.match(markdown, /\| Rank \| Title \| Tool \| Model \| Status \| Score \| Events \| Workspace \|/);

  const html = renderBenchmarkReportHtml(report);
  assert.match(html, /<!doctype html>/i);
  assert.match(html, /<h1>Benchmark Report<\/h1>/);
  assert.match(html, /<h2>Leaderboard by Tool \/ Model<\/h2>/);
  assert.match(html, /claude-sonnet-4/);

  const badge = renderBenchmarkBadge(report, "avg-score");
  assert.match(badge, /<svg/);
  assert.match(badge, /avg score/);
  assert.match(badge, />0\.91</);
});
