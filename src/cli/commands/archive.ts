import path from "node:path";
import { Command } from "commander";
import { createArchive, extractArchive } from "../../core/archive";

export function registerArchiveCommands(program: Command): void {
  program
    .command("archive")
    .description("Create a .tar.gz archive from a bundle directory.")
    .argument("<bundleDir>", "Bundle directory to archive")
    .requiredOption("-o, --out <file>", "Output archive path, usually ending in .tar.gz")
    .action(async (bundleDir: string, options: { out: string }) => {
      const archiveFile = await createArchive(path.resolve(bundleDir), path.resolve(options.out));
      console.log(`Created archive at ${archiveFile}`);
    });

  program
    .command("extract")
    .description("Extract a bundle archive into a directory.")
    .argument("<archiveFile>", "Archive file to extract")
    .requiredOption("-o, --out <dir>", "Directory to extract into")
    .action(async (archiveFile: string, options: { out: string }) => {
      const outputDir = await extractArchive(path.resolve(archiveFile), path.resolve(options.out));
      console.log(`Extracted archive into ${outputDir}`);
    });
}
