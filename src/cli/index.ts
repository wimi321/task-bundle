#!/usr/bin/env node
import { Command } from "commander";
import { registerArchiveCommands } from "./commands/archive";
import { registerCompareCommand } from "./commands/compare";
import { registerInitCommand } from "./commands/init";
import { registerInspectCommand } from "./commands/inspect";
import { registerPackCommand } from "./commands/pack";
import { registerReportCommand } from "./commands/report";
import { registerScanCommand } from "./commands/scan";
import { registerValidateCommand } from "./commands/validate";

async function main(): Promise<void> {
  const program = new Command();

  program
    .name("taskbundle")
    .description("Package AI coding work into portable task bundles.")
    .version("0.3.0");

  registerInitCommand(program);
  registerPackCommand(program);
  registerInspectCommand(program);
  registerCompareCommand(program);
  registerArchiveCommands(program);
  registerValidateCommand(program);
  registerScanCommand(program);
  registerReportCommand(program);

  await program.parseAsync(process.argv);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exitCode = 1;
});
