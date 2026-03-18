export const BUNDLE_SCHEMA_VERSION = "0.2.0";

export interface ArtifactInfo {
  path: string;
  sha256: string;
  size: number;
}

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
  branch?: string;
  tags: string[];
  artifacts: BundleArtifacts;
  artifactInfo?: Record<string, ArtifactInfo>;
  git?: GitMetadata;
  runner?: RunnerMetadata;
  outcome?: BundleOutcome;
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
  parsedEvents?: BundleEvent[];
  workspaceManifest?: WorkspaceManifest;
}

export interface BundleInspection {
  bundleDir: string;
  title: string;
  schemaVersion: string;
  createdAt: string;
  tool?: string;
  model?: string;
  runtime?: string;
  repo?: string;
  commit?: string;
  branch?: string;
  tags: string[];
  artifacts: string[];
  workspaceFileCount: number;
  eventCount: number;
  artifactInfo: Record<string, ArtifactInfo>;
  outcome?: BundleOutcome;
  promptSource?: string;
}

export interface BundleEvent {
  type: string;
  at: string;
  detail: string;
  command?: string;
  exitCode?: number;
  path?: string;
}

export interface GitMetadata {
  root?: string;
  branch?: string;
  remote?: string;
  commit?: string;
}

export interface RunnerMetadata {
  os?: string;
  nodeVersion?: string;
  cliVersion?: string;
  promptSource?: string;
}

export interface BundleOutcome {
  status?: "success" | "failure" | "partial";
  score?: number;
  judgeNotes?: string;
}

export interface BundleComparison {
  left: BundleInspection;
  right: BundleInspection;
  sameTitle: boolean;
  sameRepo: boolean;
  sameCommit: boolean;
  artifactDelta: {
    onlyInLeft: string[];
    onlyInRight: string[];
  };
  artifactChanges: Array<{
    artifact: string;
    left?: ArtifactInfo;
    right?: ArtifactInfo;
    sameHash: boolean;
    sameSize: boolean;
  }>;
  counts: {
    workspaceFilesDelta: number;
    eventCountDelta: number;
  };
  modelChange: {
    left?: string;
    right?: string;
  };
  toolChange: {
    left?: string;
    right?: string;
  };
  outcomeChange: {
    leftStatus?: BundleOutcome["status"];
    rightStatus?: BundleOutcome["status"];
    leftScore?: number;
    rightScore?: number;
    scoreDelta?: number;
  };
}

export interface BundleValidationReport {
  bundleDir: string;
  valid: boolean;
  replayReady: boolean;
  issues: string[];
}

export interface BundlePackConfig {
  title?: string;
  task?: string;
  summary?: string;
  diff?: string;
  events?: string;
  workspace?: string;
  tool?: string;
  model?: string;
  runtime?: string;
  repo?: string;
  commit?: string;
  branch?: string;
  tags?: string[];
  out?: string;
  archive?: string;
  gitAuto?: boolean;
  cwd?: string;
  status?: BundleOutcome["status"];
  score?: number;
  judgeNotes?: string;
  promptSource?: string;
}

export interface BenchmarkRunEntry {
  rank: number;
  title: string;
  bundleDir: string;
  tool?: string;
  model?: string;
  status?: BundleOutcome["status"];
  score?: number;
  repo?: string;
  commit?: string;
  branch?: string;
  eventCount: number;
  workspaceFileCount: number;
  promptSource?: string;
}

export interface BenchmarkLeaderboardEntry {
  key: string;
  tool?: string;
  model?: string;
  runs: number;
  scoredRuns: number;
  successCount: number;
  averageScore?: number;
  bestScore?: number;
}

export interface BenchmarkTaskSummary {
  title: string;
  runs: number;
  bestScore?: number;
  bestRun?: BenchmarkRunEntry;
}

export interface BenchmarkReport {
  generatedAt: string;
  rootDir: string;
  bundleCount: number;
  scoredBundleCount: number;
  averageScore?: number;
  statusCounts: Record<string, number>;
  ranking: BenchmarkRunEntry[];
  leaderboard: BenchmarkLeaderboardEntry[];
  tasks: BenchmarkTaskSummary[];
}
