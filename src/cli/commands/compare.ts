import path from "node:path";
import { Command } from "commander";
import { compareBundles } from "../../core/compare";
import { printKeyValue, printList } from "../../utils/output";

export function registerCompareCommand(program: Command): void {
  program
    .command("compare")
    .description("Compare two bundles and print their metadata deltas.")
    .option("--json", "Print machine-readable JSON instead of text")
    .argument("<left>", "Left bundle directory")
    .argument("<right>", "Right bundle directory")
    .action(async (left: string, right: string, options: { json?: boolean }) => {
      const comparison = await compareBundles(path.resolve(left), path.resolve(right));

      if (options.json) {
        console.log(JSON.stringify(comparison, null, 2));
        return;
      }

      console.log("Task Bundle Comparison");
      console.log("----------------------");
      printKeyValue("Left title", comparison.left.title);
      printKeyValue("Right title", comparison.right.title);
      printKeyValue("Same repo", String(comparison.sameRepo));
      printKeyValue("Same commit", String(comparison.sameCommit));
      printKeyValue("Left model", comparison.modelChange.left);
      printKeyValue("Right model", comparison.modelChange.right);
      printKeyValue("Left tool", comparison.toolChange.left);
      printKeyValue("Right tool", comparison.toolChange.right);
      console.log("");
      printList("Only in left", comparison.artifactDelta.onlyInLeft.length > 0 ? comparison.artifactDelta.onlyInLeft : ["None"]);
      printList("Only in right", comparison.artifactDelta.onlyInRight.length > 0 ? comparison.artifactDelta.onlyInRight : ["None"]);
      console.log("");
      printKeyValue("Workspace file delta", String(comparison.counts.workspaceFilesDelta));
      printKeyValue("Event count delta", String(comparison.counts.eventCountDelta));
    });
}
