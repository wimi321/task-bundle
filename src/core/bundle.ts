import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { buildWorkspaceManifest } from "./manifest";
import {
  BUNDLE_SCHEMA_VERSION,
  BundleContents,
  BundleInspection,
  BundleMetadata,
  BundleOutcome,
  BundleValidationReport,
  GitMetadata,
  RunnerMetadata
} from "./schema";
import { parseEventsJsonl, validateBundleMetadata, validateWorkspaceManifest } from "./validation";
import {
  copyDirectory,
  copyFileInto,
  ensureDir,
  getArtifactInfo,
  pathExists,
  readJsonFile,
  readTextFile,
  writeJsonFile,
  writeTextFile
} from "../utils/fs";

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
  branch?: string;
  tags?: string[];
  id?: string;
  createdAt?: string;
  git?: GitMetadata;
  runner?: RunnerMetadata;
  outcome?: BundleOutcome;
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
    branch: options.branch,
    tags: options.tags ?? [],
    artifacts: {
      task: "task.md",
      summary: "summary.md"
    },
    artifactInfo: {},
    git: options.git,
    runner: options.runner,
    outcome: options.outcome
  };

  await copyFileInto(path.resolve(options.taskPath), path.join(outputDir, "task.md"));
  await copyFileInto(path.resolve(options.summaryPath), path.join(outputDir, "summary.md"));

  await recordArtifactInfo(metadata, "task", outputDir, "task.md");
  await recordArtifactInfo(metadata, "summary", outputDir, "summary.md");

  if (options.diffPath) {
    metadata.artifacts.diff = "result.diff";
    await copyFileInto(path.resolve(options.diffPath), path.join(outputDir, "result.diff"));
    await recordArtifactInfo(metadata, "diff", outputDir, "result.diff");
  }

  if (options.eventsPath) {
    metadata.artifacts.events = "events.jsonl";
    await copyFileInto(path.resolve(options.eventsPath), path.join(outputDir, "events.jsonl"));
    await recordArtifactInfo(metadata, "events", outputDir, "events.jsonl");
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
    await recordArtifactInfo(metadata, "workspaceManifest", outputDir, "workspace/manifest.json");
  }

  await writeJsonFile(path.join(outputDir, "bundle.json"), metadata);
  return metadata;
}

export async function readBundle(bundleDir: string): Promise<BundleContents> {
  const resolvedBundleDir = path.resolve(bundleDir);
  const metadata = validateBundleMetadata(
    await readJsonFile<unknown>(path.join(resolvedBundleDir, "bundle.json"))
  );
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
      contents.parsedEvents = parseEventsJsonl(contents.events);
    }
  }

  if (metadata.artifacts.workspaceManifest) {
    const manifestPath = resolveBundleArtifact(resolvedBundleDir, metadata.artifacts.workspaceManifest);
    if (await pathExists(manifestPath)) {
      contents.workspaceManifest = validateWorkspaceManifest(await readJsonFile<unknown>(manifestPath));
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
      JSON.stringify({ type: "read_file", at: new Date().toISOString(), detail: "Inspected src/app.ts", path: "src/app.ts" }),
      JSON.stringify({ type: "run_command", at: new Date().toISOString(), detail: "npm test", command: "npm test", exitCode: 0 }),
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

  await writeJsonFile(path.join(resolvedDir, "taskbundle.config.json"), {
    title: "Example task bundle",
    task: "./task.md",
    summary: "./summary.md",
    diff: "./result.diff",
    events: "./events.jsonl",
    workspace: "./workspace-files",
    tool: "codex",
    model: "gpt-5",
    runtime: "node",
    gitAuto: true,
    out: "./bundle-output",
    archive: "./bundle-output.tar.gz",
    tags: ["starter"]
  });

  await writeTextFile(
    path.join(resolvedDir, "README.md"),
    [
      "# Task Bundle Starter",
      "",
      "1. Edit `task.md` and `summary.md`.",
      "2. Replace `result.diff`, `events.jsonl`, and `workspace-files/` with real task data.",
      "3. Run `npm run dev -- pack --config ./taskbundle.config.json` from the project root.",
      "4. Or pass explicit flags with `taskbundle pack` if you prefer command-line input."
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
    branch: bundle.metadata.branch,
    tags: bundle.metadata.tags,
    artifacts,
    workspaceFileCount: bundle.workspaceManifest?.fileCount ?? 0,
    eventCount: bundle.parsedEvents?.length ?? countJsonlRecords(bundle.events),
    artifactInfo: bundle.metadata.artifactInfo ?? {}
  };
}

export async function validateBundleDirectory(bundleDir: string): Promise<BundleValidationReport> {
  const resolvedBundleDir = path.resolve(bundleDir);
  const issues: string[] = [];

  try {
    const bundle = await readBundle(resolvedBundleDir);

    if (!bundle.metadata.artifacts.task) {
      issues.push("Missing task artifact pointer.");
    }

    if (!bundle.metadata.artifacts.summary) {
      issues.push("Missing summary artifact pointer.");
    }

    if (!bundle.workspaceManifest && !bundle.metadata.artifacts.workspaceFilesDir) {
      issues.push("Missing workspace snapshot or manifest.");
    }

    return {
      bundleDir: resolvedBundleDir,
      valid: issues.length === 0,
      replayReady: issues.length === 0,
      issues
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    issues.push(message);
    return {
      bundleDir: resolvedBundleDir,
      valid: false,
      replayReady: false,
      issues
    };
  }
}

export function countJsonlRecords(content: string | undefined): number {
  if (!content) {
    return 0;
  }

  return parseEventsJsonl(content).length;
}

async function recordArtifactInfo(
  metadata: BundleMetadata,
  key: string,
  bundleDir: string,
  relativePath: string
): Promise<void> {
  const absolutePath = path.join(bundleDir, relativePath);
  metadata.artifactInfo ??= {};
  metadata.artifactInfo[key] = await getArtifactInfo(absolutePath, relativePath);
}

function resolveBundleArtifact(bundleDir: string, artifactPath: string): string {
  const resolvedPath = path.resolve(bundleDir, artifactPath);
  const relativePath = path.relative(bundleDir, resolvedPath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error(`Artifact path escapes bundle directory: ${artifactPath}`);
  }

  return resolvedPath;
}
