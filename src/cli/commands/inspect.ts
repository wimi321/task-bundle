import { Command } from "commander";
import path from "node:path";
import { inspectBundle } from "../../core/bundle";
import { printKeyValue, printList } from "../../utils/output";

export function registerInspectCommand(program: Command): void {
  program
    .command("inspect")
    .description("Print a readable summary for a task bundle directory.")
    .option("--json", "Print machine-readable JSON instead of text")
    .argument("<bundleDir>", "Bundle directory to inspect")
    .action(async (bundleDir: string, options: { json?: boolean }) => {
      const resolvedDir = path.resolve(bundleDir);
      const inspection = await inspectBundle(resolvedDir);

      if (options.json) {
        console.log(JSON.stringify(inspection, null, 2));
        return;
      }

      console.log("Task Bundle");
      console.log("-----------");
      printKeyValue("Title", inspection.title);
      printKeyValue("Schema", inspection.schemaVersion);
      printKeyValue("Created", inspection.createdAt);
      printKeyValue("Tool", inspection.tool);
      printKeyValue("Model", inspection.model);
      printKeyValue("Runtime", inspection.runtime);
      printKeyValue("Repo", inspection.repo);
      printKeyValue("Commit", inspection.commit);
      printKeyValue("Branch", inspection.branch);
      printKeyValue("Status", inspection.outcome?.status);
      printKeyValue("Score", inspection.outcome?.score?.toString());
      printKeyValue("Prompt source", inspection.promptSource);
      printKeyValue("Tags", inspection.tags.join(", "));
      console.log("");
      printList("Artifacts", inspection.artifacts);

      if (inspection.workspaceFileCount > 0) {
        console.log("");
        console.log(`Workspace files: ${inspection.workspaceFileCount}`);
      }

      if (inspection.eventCount > 0) {
        console.log(`Events: ${inspection.eventCount}`);
      }
    });
}
