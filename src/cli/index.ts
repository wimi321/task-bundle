#!/usr/bin/env node
import { Command } from "commander";
import { registerInitCommand } from "./commands/init";
import { registerInspectCommand } from "./commands/inspect";
import { registerPackCommand } from "./commands/pack";

async function main(): Promise<void> {
  const program = new Command();

  program
    .name("taskbundle")
    .description("Package AI coding work into portable task bundles.")
    .version("0.1.0");

  registerInitCommand(program);
  registerPackCommand(program);
  registerInspectCommand(program);

  await program.parseAsync(process.argv);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  process.exitCode = 1;
});
