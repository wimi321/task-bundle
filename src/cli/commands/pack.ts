import { Command } from "commander";
import { createBundle } from "../../core/bundle";
import { requirePath, requireNonEmpty } from "../../utils/validation";

interface PackCliOptions {
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
  tags?: string[];
  out?: string;
}

export function registerPackCommand(program: Command): void {
  program
    .command("pack")
    .description("Build a task bundle directory from task artifacts.")
    .requiredOption("--title <title>", "Task title")
    .requiredOption("--task <file>", "Path to task markdown")
    .requiredOption("--summary <file>", "Path to summary markdown")
    .requiredOption("--out <dir>", "Output bundle directory")
    .option("--diff <file>", "Path to final diff")
    .option("--events <file>", "Path to events JSONL")
    .option("--workspace <dir>", "Directory of captured workspace files")
    .option("--tool <name>", "Tool name")
    .option("--model <name>", "Model name")
    .option("--runtime <name>", "Runtime metadata")
    .option("--repo <slug>", "Repository slug or URL")
    .option("--commit <sha>", "Commit SHA or snapshot id")
    .option("--tag <tag>", "Tag to add to bundle metadata", collectTags, [])
    .action(async (options: PackCliOptions) => {
      const title = requireNonEmpty(options.title, "title");
      const taskPath = requireNonEmpty(options.task, "task");
      const summaryPath = requireNonEmpty(options.summary, "summary");
      const outputDir = requireNonEmpty(options.out, "out");

      await requirePath(taskPath, "task file");
      await requirePath(summaryPath, "summary file");

      if (options.diff) {
        await requirePath(options.diff, "diff file");
      }

      if (options.events) {
        await requirePath(options.events, "events file");
      }

      if (options.workspace) {
        await requirePath(options.workspace, "workspace directory");
      }

      const metadata = await createBundle({
        title,
        taskPath,
        summaryPath,
        outputDir,
        diffPath: options.diff,
        eventsPath: options.events,
        workspacePath: options.workspace,
        tool: options.tool,
        model: options.model,
        runtime: options.runtime,
        repo: options.repo,
        commit: options.commit,
        tags: options.tags
      });

      console.log(`Created bundle at ${outputDir}`);
      console.log(`Bundle ID: ${metadata.id}`);
      console.log(`Schema: ${metadata.schemaVersion}`);
    });
}

function collectTags(value: string, previous: string[]): string[] {
  previous.push(value);
  return previous;
}
