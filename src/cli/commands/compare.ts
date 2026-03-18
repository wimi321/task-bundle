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
      printKeyValue("Left status", comparison.outcomeChange.leftStatus);
      printKeyValue("Right status", comparison.outcomeChange.rightStatus);
      printKeyValue("Left score", comparison.outcomeChange.leftScore?.toString());
      printKeyValue("Right score", comparison.outcomeChange.rightScore?.toString());
      printKeyValue("Score delta", formatNumber(comparison.outcomeChange.scoreDelta));
      console.log("");
      printList("Only in left", comparison.artifactDelta.onlyInLeft.length > 0 ? comparison.artifactDelta.onlyInLeft : ["None"]);
      printList("Only in right", comparison.artifactDelta.onlyInRight.length > 0 ? comparison.artifactDelta.onlyInRight : ["None"]);
      console.log("");
      printList(
        "Artifact hash changes",
        comparison.artifactChanges
          .filter((artifact) => !artifact.sameHash)
          .map((artifact) => `${artifact.artifact}: ${artifact.left?.sha256 ?? "missing"} -> ${artifact.right?.sha256 ?? "missing"}`)
          .concat(
            comparison.artifactChanges.filter((artifact) => !artifact.sameHash).length === 0 ? ["None"] : []
          )
      );
      console.log("");
      printKeyValue("Workspace file delta", String(comparison.counts.workspaceFilesDelta));
      printKeyValue("Event count delta", String(comparison.counts.eventCountDelta));
    });
}

function formatNumber(value: number | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return Number(value.toFixed(4)).toString();
}
