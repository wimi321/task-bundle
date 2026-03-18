import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { ArtifactInfo } from "../core/schema";

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function readTextFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, "utf8");
}

export async function readJsonFile<T>(filePath: string): Promise<T> {
  return JSON.parse(await readTextFile(filePath)) as T;
}

export async function writeTextFile(filePath: string, content: string): Promise<void> {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, "utf8");
}

export async function writeJsonFile(filePath: string, value: unknown): Promise<void> {
  await writeTextFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export async function copyFileInto(sourcePath: string, destinationPath: string): Promise<void> {
  await ensureDir(path.dirname(destinationPath));
  await fs.copyFile(sourcePath, destinationPath);
}

export async function copyDirectory(sourceDir: string, destinationDir: string): Promise<void> {
  await ensureDir(destinationDir);
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const destinationPath = path.join(destinationDir, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, destinationPath);
      continue;
    }

    if (entry.isFile()) {
      await copyFileInto(sourcePath, destinationPath);
    }
  }
}

export async function listFilesRecursively(rootDir: string): Promise<string[]> {
  const results: string[] = [];
  const entries = await fs.readdir(rootDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await listFilesRecursively(fullPath)));
      continue;
    }

    if (entry.isFile()) {
      results.push(fullPath);
    }
  }

  return results.sort();
}

export async function sha256File(filePath: string): Promise<string> {
  const content = await fs.readFile(filePath);
  return createHash("sha256").update(content).digest("hex");
}

export async function getArtifactInfo(filePath: string, relativePath: string): Promise<ArtifactInfo> {
  const stats = await fs.stat(filePath);
  return {
    path: relativePath,
    sha256: await sha256File(filePath),
    size: stats.size
  };
}
