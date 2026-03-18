import { promises as fs } from "node:fs";
import path from "node:path";
import { inspectBundle } from "./bundle";
import { BundleInspection } from "./schema";

export async function scanBundles(rootDir: string): Promise<BundleInspection[]> {
  const resolvedRootDir = path.resolve(rootDir);
  const bundleDirs = await findBundleDirectories(resolvedRootDir);
  const inspections: BundleInspection[] = [];

  for (const bundleDir of bundleDirs) {
    inspections.push(await inspectBundle(bundleDir));
  }

  return inspections.sort((left, right) => left.title.localeCompare(right.title));
}

async function findBundleDirectories(rootDir: string): Promise<string[]> {
  const bundleDirs: string[] = [];

  if (await hasBundleJson(rootDir)) {
    bundleDirs.push(rootDir);
  }

  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const candidate = path.join(rootDir, entry.name);
    if (await hasBundleJson(candidate)) {
      bundleDirs.push(candidate);
    }
  }

  return bundleDirs;
}

async function hasBundleJson(candidateDir: string): Promise<boolean> {
  try {
    await fs.access(path.join(candidateDir, "bundle.json"));
    return true;
  } catch {
    return false;
  }
}
