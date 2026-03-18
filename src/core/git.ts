import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { GitMetadata } from "./schema";

const execFileAsync = promisify(execFile);

export async function detectGitMetadata(startDir: string): Promise<GitMetadata | undefined> {
  const resolvedDir = path.resolve(startDir);

  try {
    const root = await readGitValue(resolvedDir, ["rev-parse", "--show-toplevel"]);
    const commit = await readGitValue(resolvedDir, ["rev-parse", "HEAD"]);
    const branch = await readGitValue(resolvedDir, ["rev-parse", "--abbrev-ref", "HEAD"]);
    const remote = await readGitValue(resolvedDir, ["remote", "get-url", "origin"]).catch(() => undefined);

    return {
      root,
      commit,
      branch: branch === "HEAD" ? undefined : branch,
      remote
    };
  } catch {
    return undefined;
  }
}

async function readGitValue(cwd: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync("git", ["-C", cwd, ...args], {
    encoding: "utf8"
  });

  return stdout.trim();
}
