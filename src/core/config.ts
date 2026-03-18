import path from "node:path";
import { readJsonFile } from "../utils/fs";
import { BundlePackConfig } from "./schema";
import { validatePackConfig } from "./validation";

export interface ResolvedPackConfig {
  baseDir: string;
  values: BundlePackConfig;
}

export async function loadPackConfig(configPath: string): Promise<ResolvedPackConfig> {
  const resolvedPath = path.resolve(configPath);
  const raw = await readJsonFile<unknown>(resolvedPath);
  return {
    baseDir: path.dirname(resolvedPath),
    values: validatePackConfig(raw)
  };
}

export function resolveConfigPath(baseDir: string, targetPath: string | undefined): string | undefined {
  if (!targetPath) {
    return undefined;
  }

  return path.resolve(baseDir, targetPath);
}
