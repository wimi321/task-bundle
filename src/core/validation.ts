import { BundleEvent, BundleMetadata, BundlePackConfig, WorkspaceManifest } from "./schema";

function assertObject(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`);
  }

  return value as Record<string, unknown>;
}

function assertString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} must be a non-empty string.`);
  }

  return value;
}

function optionalString(value: unknown, label: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return assertString(value, label);
}

function optionalStringArray(value: unknown, label: string): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    throw new Error(`${label} must be an array of strings.`);
  }

  return value;
}

export function validateBundleMetadata(value: unknown): BundleMetadata {
  const metadata = assertObject(value, "bundle metadata");
  const artifacts = assertObject(metadata.artifacts, "bundle metadata.artifacts");
  const artifactInfo = metadata.artifactInfo ? assertObject(metadata.artifactInfo, "bundle metadata.artifactInfo") : undefined;
  const git = metadata.git ? assertObject(metadata.git, "bundle metadata.git") : undefined;
  const runner = metadata.runner ? assertObject(metadata.runner, "bundle metadata.runner") : undefined;
  const outcome = metadata.outcome ? assertObject(metadata.outcome, "bundle metadata.outcome") : undefined;

  return {
    schemaVersion: assertString(metadata.schemaVersion, "bundle metadata.schemaVersion"),
    id: assertString(metadata.id, "bundle metadata.id"),
    title: assertString(metadata.title, "bundle metadata.title"),
    createdAt: assertString(metadata.createdAt, "bundle metadata.createdAt"),
    tool: optionalString(metadata.tool, "bundle metadata.tool"),
    model: optionalString(metadata.model, "bundle metadata.model"),
    runtime: optionalString(metadata.runtime, "bundle metadata.runtime"),
    repo: optionalString(metadata.repo, "bundle metadata.repo"),
    commit: optionalString(metadata.commit, "bundle metadata.commit"),
    branch: optionalString(metadata.branch, "bundle metadata.branch"),
    tags: optionalStringArray(metadata.tags, "bundle metadata.tags") ?? [],
    artifacts: {
      task: assertString(artifacts.task, "bundle metadata.artifacts.task"),
      summary: assertString(artifacts.summary, "bundle metadata.artifacts.summary"),
      diff: optionalString(artifacts.diff, "bundle metadata.artifacts.diff"),
      events: optionalString(artifacts.events, "bundle metadata.artifacts.events"),
      workspaceManifest: optionalString(
        artifacts.workspaceManifest,
        "bundle metadata.artifacts.workspaceManifest"
      ),
      workspaceFilesDir: optionalString(
        artifacts.workspaceFilesDir,
        "bundle metadata.artifacts.workspaceFilesDir"
      )
    },
    artifactInfo: artifactInfo
      ? Object.fromEntries(
          Object.entries(artifactInfo).map(([key, entry]) => {
            const info = assertObject(entry, `bundle metadata.artifactInfo.${key}`);
            return [
              key,
              {
                path: assertString(info.path, `bundle metadata.artifactInfo.${key}.path`),
                sha256: assertString(info.sha256, `bundle metadata.artifactInfo.${key}.sha256`),
                size: Number(info.size)
              }
            ];
          })
        )
      : undefined,
    git: git
      ? {
          root: optionalString(git.root, "bundle metadata.git.root"),
          branch: optionalString(git.branch, "bundle metadata.git.branch"),
          remote: optionalString(git.remote, "bundle metadata.git.remote"),
          commit: optionalString(git.commit, "bundle metadata.git.commit")
        }
      : undefined,
    runner: runner
      ? {
          os: optionalString(runner.os, "bundle metadata.runner.os"),
          nodeVersion: optionalString(runner.nodeVersion, "bundle metadata.runner.nodeVersion"),
          cliVersion: optionalString(runner.cliVersion, "bundle metadata.runner.cliVersion"),
          promptSource: optionalString(runner.promptSource, "bundle metadata.runner.promptSource")
        }
      : undefined,
    outcome: outcome
      ? {
          status:
            outcome.status === undefined
              ? undefined
              : (assertString(
                  outcome.status,
                  "bundle metadata.outcome.status"
                ) as "success" | "failure" | "partial"),
          score: typeof outcome.score === "number" ? outcome.score : undefined,
          judgeNotes: optionalString(outcome.judgeNotes, "bundle metadata.outcome.judgeNotes")
        }
      : undefined
  };
}

export function validateWorkspaceManifest(value: unknown): WorkspaceManifest {
  const manifest = assertObject(value, "workspace manifest");
  const files = manifest.files;

  if (!Array.isArray(files)) {
    throw new Error("workspace manifest.files must be an array.");
  }

  return {
    capturedAt: assertString(manifest.capturedAt, "workspace manifest.capturedAt"),
    root: assertString(manifest.root, "workspace manifest.root"),
    fileCount: Number(manifest.fileCount),
    files: files.map((entry, index) => {
      const file = assertObject(entry, `workspace manifest.files[${index}]`);
      return {
        path: assertString(file.path, `workspace manifest.files[${index}].path`),
        sha256: assertString(file.sha256, `workspace manifest.files[${index}].sha256`),
        size: Number(file.size)
      };
    })
  };
}

export function parseEventsJsonl(content: string): BundleEvent[] {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line, index) => {
      let raw: unknown;
      try {
        raw = JSON.parse(line);
      } catch {
        throw new Error(`events.jsonl line ${index + 1} is not valid JSON.`);
      }

      const event = assertObject(raw, `events.jsonl line ${index + 1}`);
      return {
        type: assertString(event.type, `events.jsonl line ${index + 1}.type`),
        at: assertString(event.at, `events.jsonl line ${index + 1}.at`),
        detail: assertString(event.detail, `events.jsonl line ${index + 1}.detail`),
        command: optionalString(event.command, `events.jsonl line ${index + 1}.command`),
        exitCode: typeof event.exitCode === "number" ? event.exitCode : undefined,
        path: optionalString(event.path, `events.jsonl line ${index + 1}.path`)
      };
    });
}

export function validatePackConfig(value: unknown): BundlePackConfig {
  const config = assertObject(value, "pack config");

  return {
    title: optionalString(config.title, "pack config.title"),
    task: optionalString(config.task, "pack config.task"),
    summary: optionalString(config.summary, "pack config.summary"),
    diff: optionalString(config.diff, "pack config.diff"),
    events: optionalString(config.events, "pack config.events"),
    workspace: optionalString(config.workspace, "pack config.workspace"),
    tool: optionalString(config.tool, "pack config.tool"),
    model: optionalString(config.model, "pack config.model"),
    runtime: optionalString(config.runtime, "pack config.runtime"),
    repo: optionalString(config.repo, "pack config.repo"),
    commit: optionalString(config.commit, "pack config.commit"),
    branch: optionalString(config.branch, "pack config.branch"),
    tags: optionalStringArray(config.tags, "pack config.tags"),
    out: optionalString(config.out, "pack config.out"),
    archive: optionalString(config.archive, "pack config.archive"),
    gitAuto: typeof config.gitAuto === "boolean" ? config.gitAuto : undefined,
    cwd: optionalString(config.cwd, "pack config.cwd")
  };
}
