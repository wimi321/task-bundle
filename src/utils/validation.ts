import { pathExists } from "./fs";

export async function requirePath(targetPath: string, label: string): Promise<void> {
  if (!(await pathExists(targetPath))) {
    throw new Error(`${label} not found: ${targetPath}`);
  }
}

export function requireNonEmpty(value: string | undefined, label: string): string {
  if (!value || value.trim() === "") {
    throw new Error(`${label} is required.`);
  }

  return value.trim();
}
