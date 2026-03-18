import path from "node:path";
import { Command } from "commander";
import { validateBundleDirectory } from "../../core/bundle";
import { printList } from "../../utils/output";

export function registerValidateCommand(program: Command): void {
  program
    .command("validate")
    .description("Validate a bundle and check whether it is replay-ready.")
    .option("--json", "Print machine-readable JSON instead of text")
    .argument("<bundleDir>", "Bundle directory to validate")
    .action(async (bundleDir: string, options: { json?: boolean }) => {
      const report = await validateBundleDirectory(path.resolve(bundleDir));

      if (options.json) {
        console.log(JSON.stringify(report, null, 2));
        return;
      }

      console.log("Task Bundle Validation");
      console.log("----------------------");
      console.log(`Valid: ${report.valid}`);
      console.log(`Replay ready: ${report.replayReady}`);
      printList("Issues", report.issues.length > 0 ? report.issues : ["None"]);
    });
}
