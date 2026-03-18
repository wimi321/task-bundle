import { Command } from "commander";
import path from "node:path";
import { createInitTemplate } from "../../core/bundle";

export function registerInitCommand(program: Command): void {
  program
    .command("init")
    .description("Create starter files for a new task bundle.")
    .option("-o, --out <dir>", "Directory to write starter files into", "taskbundle-starter")
    .action(async (options: { out: string }) => {
      const targetDir = path.resolve(options.out);
      await createInitTemplate(targetDir);
      console.log(`Initialized starter bundle inputs at ${targetDir}`);
      console.log("Next step: edit the files, then run `taskbundle pack --config ./taskbundle.config.json`.");
    });
}
