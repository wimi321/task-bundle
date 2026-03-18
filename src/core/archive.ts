import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { ensureDir } from "../utils/fs";

const execFileAsync = promisify(execFile);

export async function createArchive(bundleDir: string, outputFile: string): Promise<string> {
  const resolvedBundleDir = path.resolve(bundleDir);
  const resolvedOutputFile = path.resolve(outputFile);
  await ensureDir(path.dirname(resolvedOutputFile));

  await execFileAsync("tar", [
    "-czf",
    resolvedOutputFile,
    "-C",
    path.dirname(resolvedBundleDir),
    path.basename(resolvedBundleDir)
  ]);

  return resolvedOutputFile;
}

export async function extractArchive(archiveFile: string, outputDir: string): Promise<string> {
  const resolvedArchiveFile = path.resolve(archiveFile);
  const resolvedOutputDir = path.resolve(outputDir);
  await ensureDir(resolvedOutputDir);

  await execFileAsync("tar", ["-xzf", resolvedArchiveFile, "-C", resolvedOutputDir]);
  return resolvedOutputDir;
}
