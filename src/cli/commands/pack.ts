import path from "node:path";
import { Command } from "commander";
import { createArchive } from "../../core/archive";
import { createBundle } from "../../core/bundle";
import { loadPackConfig, resolveConfigPath } from "../../core/config";
import { detectGitMetadata } from "../../core/git";
import { BundlePackConfig, RunnerMetadata } from "../../core/schema";
import { requirePath, requireNonEmpty } from "../../utils/validation";

interface PackCliOptions {
  config?: string;
  title?: string;
  task?: string;
  summary?: string;
  diff?: string;
  events?: string;
  workspace?: string;
  tool?: string;
  model?: string;
  runtime?: string;
  repo?: string;
  commit?: string;
  branch?: string;
  tags?: string[];
  out?: string;
  archive?: string;
  cwd?: string;
  gitAuto?: boolean;
}

export function registerPackCommand(program: Command): void {
  program
    .command("pack")
    .description("Build a task bundle directory from task artifacts.")
    .option("--config <file>", "Load pack settings from a JSON config file")
    .option("--title <title>", "Task title")
    .option("--task <file>", "Path to task markdown")
    .option("--summary <file>", "Path to summary markdown")
    .option("--out <dir>", "Output bundle directory")
    .option("--diff <file>", "Path to final diff")
    .option("--events <file>", "Path to events JSONL")
    .option("--workspace <dir>", "Directory of captured workspace files")
    .option("--tool <name>", "Tool name")
    .option("--model <name>", "Model name")
    .option("--runtime <name>", "Runtime metadata")
    .option("--repo <slug>", "Repository slug or URL")
    .option("--commit <sha>", "Commit SHA or snapshot id")
    .option("--branch <name>", "Git branch name")
    .option("--archive <file>", "Write a .tar.gz archive after packing")
    .option("--cwd <dir>", "Base working directory for config resolution and git detection")
    .option("--tag <tag>", "Tag to add to bundle metadata", collectTags, [])
    .option("--no-git-auto", "Disable automatic git metadata detection")
    .action(async (options: PackCliOptions, command: Command) => {
      const config = options.config ? await loadPackConfig(options.config) : undefined;
      const merged = mergePackOptions(options, config?.values, command);
      const resolutionBaseDir = path.resolve(options.cwd ?? config?.values.cwd ?? config?.baseDir ?? process.cwd());

      const title = requireNonEmpty(merged.title, "title");
      const taskPath = requireNonEmpty(resolveFieldPath(merged.task, resolutionBaseDir), "task");
      const summaryPath = requireNonEmpty(resolveFieldPath(merged.summary, resolutionBaseDir), "summary");
      const outputDir = requireNonEmpty(resolveFieldPath(merged.out, resolutionBaseDir), "out");
      const diffPath = resolveFieldPath(merged.diff, resolutionBaseDir);
      const eventsPath = resolveFieldPath(merged.events, resolutionBaseDir);
      const workspacePath = resolveFieldPath(merged.workspace, resolutionBaseDir);
      const archivePath = resolveFieldPath(merged.archive, resolutionBaseDir);

      await requirePath(taskPath, "task file");
      await requirePath(summaryPath, "summary file");

      if (diffPath) {
        await requirePath(diffPath, "diff file");
      }

      if (eventsPath) {
        await requirePath(eventsPath, "events file");
      }

      if (workspacePath) {
        await requirePath(workspacePath, "workspace directory");
      }

      const gitMetadata =
        merged.gitAuto === false
          ? undefined
          : await detectGitMetadata(workspacePath ?? path.dirname(taskPath));

      const runner: RunnerMetadata = {
        os: process.platform,
        nodeVersion: process.version,
        cliVersion: "0.2.0",
        promptSource: options.config ? "config" : "cli"
      };

      const metadata = await createBundle({
        title,
        taskPath,
        summaryPath,
        outputDir,
        diffPath,
        eventsPath,
        workspacePath,
        tool: merged.tool,
        model: merged.model,
        runtime: merged.runtime,
        repo: merged.repo ?? gitMetadata?.remote,
        commit: merged.commit ?? gitMetadata?.commit,
        branch: merged.branch ?? gitMetadata?.branch,
        tags: merged.tags ?? [],
        git: gitMetadata,
        runner
      });

      console.log(`Created bundle at ${outputDir}`);
      console.log(`Bundle ID: ${metadata.id}`);
      console.log(`Schema: ${metadata.schemaVersion}`);

      if (archivePath) {
        const archiveFile = await createArchive(outputDir, archivePath);
        console.log(`Archive: ${archiveFile}`);
      }
    });
}

function collectTags(value: string, previous: string[]): string[] {
  previous.push(value);
  return previous;
}

function mergePackOptions(
  cli: PackCliOptions,
  config: BundlePackConfig | undefined,
  command: Command
): BundlePackConfig {
  const cliTags = cli.tags && cli.tags.length > 0 ? cli.tags : undefined;
  const gitAutoSource = command.getOptionValueSource("gitAuto");
  const gitAuto = gitAutoSource === "default" ? config?.gitAuto : cli.gitAuto;

  return {
    ...config,
    ...stripUndefined({
      title: cli.title,
      task: cli.task,
      summary: cli.summary,
      diff: cli.diff,
      events: cli.events,
      workspace: cli.workspace,
      tool: cli.tool,
      model: cli.model,
      runtime: cli.runtime,
      repo: cli.repo,
      commit: cli.commit,
      branch: cli.branch,
      out: cli.out,
      archive: cli.archive,
      cwd: cli.cwd,
      tags: cliTags,
      gitAuto
    })
  };
}

function resolveFieldPath(value: string | undefined, baseDir: string): string | undefined {
  if (!value) {
    return undefined;
  }

  if (path.isAbsolute(value)) {
    return value;
  }

  return resolveConfigPath(baseDir, value);
}

function stripUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  ) as Partial<T>;
}
