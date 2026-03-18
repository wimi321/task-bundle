import path from "node:path";
import { Command } from "commander";
import { scanBundles } from "../../core/scan";
import { printKeyValue } from "../../utils/output";

export function registerScanCommand(program: Command): void {
  program
    .command("scan")
    .description("Scan a directory for bundle folders and print a summary.")
    .option("--json", "Print machine-readable JSON instead of text")
    .argument("<rootDir>", "Directory to scan for bundles")
    .action(async (rootDir: string, options: { json?: boolean }) => {
      const inspections = await scanBundles(path.resolve(rootDir));

      if (options.json) {
        console.log(JSON.stringify(inspections, null, 2));
        return;
      }

      console.log("Task Bundle Scan");
      console.log("----------------");
      printKeyValue("Bundles found", String(inspections.length));

      for (const inspection of inspections) {
        console.log("");
        console.log(inspection.title);
        console.log(`- schema: ${inspection.schemaVersion}`);
        console.log(`- tool/model: ${inspection.tool ?? "unknown"} / ${inspection.model ?? "unknown"}`);
        console.log(`- workspace files: ${inspection.workspaceFileCount}`);
        console.log(`- events: ${inspection.eventCount}`);
      }
    });
}
