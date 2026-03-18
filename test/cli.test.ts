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
  };

  assert.equal(parsed.title, "Fix greeting punctuation");
  assert.equal(parsed.schemaVersion, "0.2.0");
  assert.equal(parsed.eventCount, 3);
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
  };

  assert.equal(parsed.sameTitle, true);
  assert.equal(parsed.counts.eventCountDelta, -1);
  assert.equal(parsed.modelChange.right, "claude-sonnet-4");
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
  const parsed = JSON.parse(stdout) as Array<{ title: string; model?: string }>;

  assert.equal(parsed.length >= 2, true);
  assert.ok(parsed.some((entry) => entry.model === "gpt-5"));
  assert.ok(parsed.some((entry) => entry.model === "claude-sonnet-4"));
});
