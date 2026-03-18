import { randomUUID } from "node:crypto";
import path from "node:path";
import { promises as fs } from "node:fs";
import { buildWorkspaceManifest } from "./manifest";
import { BUNDLE_SCHEMA_VERSION, BundleContents, BundleInspection, BundleMetadata } from "./schema";
import { copyDirectory, copyFileInto, ensureDir, pathExists, readTextFile, writeJsonFile, writeTextFile } from "../utils/fs";

export interface PackOptions {
  title: string;
  taskPath: string;
  summaryPath: string;
  outputDir: string;
  diffPath?: string;
  eventsPath?: string;
  workspacePath?: string;
  tool?: string;
  model?: string;
  runtime?: string;
  repo?: string;
  commit?: string;
  tags?: string[];
  id?: string;
  createdAt?: string;
}

export async function createBundle(options: PackOptions): Promise<BundleMetadata> {
  const outputDir = path.resolve(options.outputDir);
  await fs.rm(outputDir, { recursive: true, force: true });
  await ensureDir(outputDir);

  const metadata: BundleMetadata = {
    schemaVersion: BUNDLE_SCHEMA_VERSION,
    id: options.id ?? randomUUID(),
    title: options.title,
    createdAt: options.createdAt ?? new Date().toISOString(),
    tool: options.tool,
    model: options.model,
    runtime: options.runtime,
    repo: options.repo,
    commit: options.commit,
    tags: options.tags ?? [],
    artifacts: {
      task: "task.md",
      summary: "summary.md"
    }
  };

  await copyFileInto(path.resolve(options.taskPath), path.join(outputDir, "task.md"));
  await copyFileInto(path.resolve(options.summaryPath), path.join(outputDir, "summary.md"));

  if (options.diffPath) {
    metadata.artifacts.diff = "result.diff";
    await copyFileInto(path.resolve(options.diffPath), path.join(outputDir, "result.diff"));
  }

  if (options.eventsPath) {
    metadata.artifacts.events = "events.jsonl";
    await copyFileInto(path.resolve(options.eventsPath), path.join(outputDir, "events.jsonl"));
  }

  if (options.workspacePath) {
    const workspaceRoot = path.resolve(options.workspacePath);
    const workspaceDir = path.join(outputDir, "workspace");
    const workspaceFilesDir = path.join(workspaceDir, "files");
    await ensureDir(workspaceFilesDir);
    await copyDirectory(workspaceRoot, workspaceFilesDir);

    const manifest = await buildWorkspaceManifest(workspaceFilesDir);
    metadata.artifacts.workspaceManifest = "workspace/manifest.json";
    metadata.artifacts.workspaceFilesDir = "workspace/files";
    await writeJsonFile(path.join(workspaceDir, "manifest.json"), manifest);
  }

  await writeJsonFile(path.join(outputDir, "bundle.json"), metadata);
  return metadata;
}

export async function readBundle(bundleDir: string): Promise<BundleContents> {
  const resolvedBundleDir = path.resolve(bundleDir);
  const metadata = JSON.parse(await readTextFile(path.join(resolvedBundleDir, "bundle.json"))) as BundleMetadata;
  const task = await readTextFile(resolveBundleArtifact(resolvedBundleDir, metadata.artifacts.task));
  const summary = await readTextFile(resolveBundleArtifact(resolvedBundleDir, metadata.artifacts.summary));

  const contents: BundleContents = { metadata, task, summary };

  if (metadata.artifacts.diff) {
    const diffPath = resolveBundleArtifact(resolvedBundleDir, metadata.artifacts.diff);
    if (await pathExists(diffPath)) {
      contents.diff = await readTextFile(diffPath);
    }
  }

  if (metadata.artifacts.events) {
    const eventsPath = resolveBundleArtifact(resolvedBundleDir, metadata.artifacts.events);
    if (await pathExists(eventsPath)) {
      contents.events = await readTextFile(eventsPath);
    }
  }

  if (metadata.artifacts.workspaceManifest) {
    const manifestPath = resolveBundleArtifact(resolvedBundleDir, metadata.artifacts.workspaceManifest);
    if (await pathExists(manifestPath)) {
      contents.workspaceManifest = JSON.parse(await readTextFile(manifestPath));
    }
  }

  return contents;
}

export async function createInitTemplate(destinationDir: string): Promise<void> {
  const resolvedDir = path.resolve(destinationDir);
  await ensureDir(resolvedDir);

  await writeTextFile(
    path.join(resolvedDir, "task.md"),
    [
      "# Task",
      "",
      "Describe the coding task here.",
      "",
      "## Constraints",
      "- Keep the patch small and reviewable.",
      "",
      "## Acceptance Criteria",
      "- The change builds and the target behavior is verified."
    ].join("\n")
  );

  await writeTextFile(
    path.join(resolvedDir, "summary.md"),
    [
      "# Summary",
      "",
      "- Status: success",
      "- Outcome: describe the delivered result",
      "- Notes: call out any follow-up items"
    ].join("\n")
  );

  await writeTextFile(
    path.join(resolvedDir, "events.jsonl"),
    [
      JSON.stringify({ type: "read_file", at: new Date().toISOString(), detail: "Inspected src/app.ts" }),
      JSON.stringify({ type: "run_command", at: new Date().toISOString(), detail: "npm test" }),
      JSON.stringify({ type: "write_diff", at: new Date().toISOString(), detail: "Captured final patch" })
    ].join("\n") + "\n"
  );

  await writeTextFile(
    path.join(resolvedDir, "result.diff"),
    [
      "diff --git a/src/app.ts b/src/app.ts",
      "index 1111111..2222222 100644",
      "--- a/src/app.ts",
      "+++ b/src/app.ts",
      "@@ -1 +1 @@",
      "-console.log('before');",
      "+console.log('after');"
    ].join("\n") + "\n"
  );

  await writeTextFile(
    path.join(resolvedDir, "workspace-files", "src", "app.ts"),
    "export function main(): string {\n  return 'hello task bundle';\n}\n"
  );

  await writeTextFile(
    path.join(resolvedDir, "README.md"),
    [
      "# Task Bundle Starter",
      "",
      "1. Edit `task.md` and `summary.md`.",
      "2. Replace `result.diff`, `events.jsonl`, and `workspace-files/` with real task data.",
      "3. Run `npm run dev -- pack --title \"Your task\" --task ./task.md --summary ./summary.md --diff ./result.diff --events ./events.jsonl --workspace ./workspace-files --out ./bundle-output` from the project root."
    ].join("\n")
  );
}

export async function detectArtifacts(bundleDir: string): Promise<string[]> {
  const entries = await fs.readdir(bundleDir, { withFileTypes: true });
  return entries.map((entry) => entry.name).sort();
}

export async function inspectBundle(bundleDir: string): Promise<BundleInspection> {
  const resolvedBundleDir = path.resolve(bundleDir);
  const bundle = await readBundle(resolvedBundleDir);
  const artifacts = await detectArtifacts(resolvedBundleDir);

  return {
    title: bundle.metadata.title,
    schemaVersion: bundle.metadata.schemaVersion,
    createdAt: bundle.metadata.createdAt,
    tool: bundle.metadata.tool,
    model: bundle.metadata.model,
    runtime: bundle.metadata.runtime,
    repo: bundle.metadata.repo,
    commit: bundle.metadata.commit,
    tags: bundle.metadata.tags,
    artifacts,
    workspaceFileCount: bundle.workspaceManifest?.fileCount ?? 0,
    eventCount: countJsonlRecords(bundle.events)
  };
}

export function countJsonlRecords(content: string | undefined): number {
  if (!content) {
    return 0;
  }

  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0).length;
}

function resolveBundleArtifact(bundleDir: string, artifactPath: string): string {
  const resolvedPath = path.resolve(bundleDir, artifactPath);
  const relativePath = path.relative(bundleDir, resolvedPath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error(`Artifact path escapes bundle directory: ${artifactPath}`);
  }

  return resolvedPath;
}
