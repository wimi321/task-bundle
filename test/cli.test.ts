import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { pathExists } from "../src/utils/fs";

const execFileAsync = promisify(execFile);
const repoRoot = "/Users/haoc/Developer/task-bundle";

async function makeTempDir(prefix: string): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), prefix));
}

async function runCli(args: string[], cwd = repoRoot): Promise<string> {
  const { stdout } = await execFileAsync("node", ["--import", "tsx", path.join(repoRoot, "src/cli/index.ts"), ...args], {
    cwd,
    encoding: "utf8"
  });

  return stdout;
}

test("inspect --json prints structured bundle data", async () => {
  const stdout = await runCli(["inspect", "--json", "./examples/hello-world-bundle"]);
  const parsed = JSON.parse(stdout) as {
    title: string;
    schemaVersion: string;
    eventCount: number;
    outcome?: { status?: string; score?: number };
    promptSource?: string;
  };

  assert.equal(parsed.title, "Fix greeting punctuation");
  assert.equal(parsed.schemaVersion, "0.2.0");
  assert.equal(parsed.eventCount, 3);
  assert.equal(parsed.outcome?.status, "success");
  assert.equal(parsed.outcome?.score, 0.93);
  assert.equal(parsed.promptSource, "cli");
});

test("compare --json compares bundles", async () => {
  const stdout = await runCli([
    "compare",
    "--json",
    "./examples/hello-world-bundle",
    "./examples/hello-world-bundle-claude"
  ]);
  const parsed = JSON.parse(stdout) as {
    sameTitle: boolean;
    counts: { eventCountDelta: number };
    modelChange: { right: string };
    outcomeChange: { scoreDelta?: number };
    artifactChanges: Array<{ artifact: string; sameHash: boolean }>;
  };

  assert.equal(parsed.sameTitle, true);
  assert.equal(parsed.counts.eventCountDelta, -1);
  assert.equal(parsed.modelChange.right, "claude-sonnet-4");
  assert.ok(Math.abs((parsed.outcomeChange.scoreDelta ?? 0) - 0.04) < 1e-9);
  assert.ok(parsed.artifactChanges.some((entry) => entry.artifact === "summary" && entry.sameHash === false));
});

test("archive and extract commands round-trip a bundle", async () => {
  const tempDir = await makeTempDir("taskbundle-archive-");

  try {
    const archivePath = path.join(tempDir, "bundle.tar.gz");
    const extractPath = path.join(tempDir, "extracted");

    await runCli(["archive", "./examples/hello-world-bundle", "--out", archivePath]);
    assert.equal(await pathExists(archivePath), true);

    await runCli(["extract", archivePath, "--out", extractPath]);
    const extractedBundleJson = path.join(extractPath, "hello-world-bundle", "bundle.json");
    assert.equal(await pathExists(extractedBundleJson), true);

    const bundleJson = await readFile(extractedBundleJson, "utf8");
    assert.match(bundleJson, /Fix greeting punctuation/);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("validate --json reports a replay-ready example bundle", async () => {
  const stdout = await runCli(["validate", "--json", "./examples/hello-world-bundle"]);
  const parsed = JSON.parse(stdout) as {
    valid: boolean;
    replayReady: boolean;
  };

  assert.equal(parsed.valid, true);
  assert.equal(parsed.replayReady, true);
});

test("scan --json finds example bundles in a directory", async () => {
  const stdout = await runCli(["scan", "--json", "./examples"]);
  const parsed = JSON.parse(stdout) as Array<{ title: string; model?: string; outcome?: { score?: number } }>;

  assert.equal(parsed.length >= 2, true);
  assert.ok(parsed.some((entry) => entry.model === "gpt-5"));
  assert.ok(parsed.some((entry) => entry.model === "claude-sonnet-4"));
  assert.ok(parsed.some((entry) => entry.model === "gpt-5" && entry.outcome?.score === 0.93));
});

test("report --json summarizes a benchmark directory", async () => {
  const stdout = await runCli(["report", "--json", "./examples"]);
  const parsed = JSON.parse(stdout) as {
    bundleCount: number;
    ranking: Array<{ rank: number; model?: string }>;
    leaderboard: Array<{ model?: string; averageScore?: number }>;
  };

  assert.equal(parsed.bundleCount >= 2, true);
  assert.equal(parsed.ranking[0]?.rank, 1);
  assert.equal(parsed.ranking[0]?.model, "gpt-5");
  assert.equal(parsed.leaderboard[0]?.model, "gpt-5");
});

test("report writes a markdown file", async () => {
  const tempDir = await makeTempDir("taskbundle-report-");

  try {
    const outputPath = path.join(tempDir, "report.md");
    await runCli(["report", "./examples", "--out", outputPath]);
    assert.equal(await pathExists(outputPath), true);

    const markdown = await readFile(outputPath, "utf8");
    assert.match(markdown, /# Benchmark Report/);
    assert.match(markdown, /## Ranking/);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("report writes a self-contained html file", async () => {
  const tempDir = await makeTempDir("taskbundle-report-html-");

  try {
    const outputPath = path.join(tempDir, "report.html");
    await runCli(["report", "./examples", "--html-out", outputPath]);
    assert.equal(await pathExists(outputPath), true);

    const html = await readFile(outputPath, "utf8");
    assert.match(html, /<!doctype html>/i);
    assert.match(html, /Task Bundle Benchmark Report/);
    assert.match(html, /<h2>Ranking<\/h2>/);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("badge writes an svg file", async () => {
  const tempDir = await makeTempDir("taskbundle-badge-");

  try {
    const outputPath = path.join(tempDir, "avg-score.svg");
    await runCli(["badge", "./examples", "--metric", "avg-score", "--out", outputPath]);
    assert.equal(await pathExists(outputPath), true);

    const svg = await readFile(outputPath, "utf8");
    assert.match(svg, /<svg/);
    assert.match(svg, /avg score/);
    assert.match(svg, /0\.91/);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
