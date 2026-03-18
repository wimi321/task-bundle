export const BUNDLE_SCHEMA_VERSION = "0.1.0";

export interface BundleArtifacts {
  task: string;
  summary: string;
  diff?: string;
  events?: string;
  workspaceManifest?: string;
  workspaceFilesDir?: string;
}

export interface BundleMetadata {
  schemaVersion: string;
  id: string;
  title: string;
  createdAt: string;
  tool?: string;
  model?: string;
  runtime?: string;
  repo?: string;
  commit?: string;
  tags: string[];
  artifacts: BundleArtifacts;
}

export interface WorkspaceManifestEntry {
  path: string;
  sha256: string;
  size: number;
}

export interface WorkspaceManifest {
  capturedAt: string;
  root: string;
  fileCount: number;
  files: WorkspaceManifestEntry[];
}

export interface BundleContents {
  metadata: BundleMetadata;
  task: string;
  summary: string;
  diff?: string;
  events?: string;
  workspaceManifest?: WorkspaceManifest;
}

export interface BundleInspection {
  title: string;
  schemaVersion: string;
  createdAt: string;
  tool?: string;
  model?: string;
  runtime?: string;
  repo?: string;
  commit?: string;
  tags: string[];
  artifacts: string[];
  workspaceFileCount: number;
  eventCount: number;
}
