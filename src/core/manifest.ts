import { stat } from "node:fs/promises";
import path from "node:path";
import { listFilesRecursively, sha256File } from "../utils/fs";
import { WorkspaceManifest, WorkspaceManifestEntry } from "./schema";

export async function buildWorkspaceManifest(rootDir: string): Promise<WorkspaceManifest> {
  const files = await listFilesRecursively(rootDir);
  const entries: WorkspaceManifestEntry[] = [];

  for (const filePath of files) {
    const relativePath = path.relative(rootDir, filePath).split(path.sep).join("/");
    const stats = await stat(filePath);
    entries.push({
      path: relativePath,
      sha256: await sha256File(filePath),
      size: stats.size
    });
  }

  return {
    capturedAt: new Date().toISOString(),
    root: "workspace/files",
    fileCount: entries.length,
    files: entries
  };
}
