import path from "node:path";
import {
  BenchmarkLeaderboardEntry,
  BenchmarkReport,
  BenchmarkRunEntry,
  BenchmarkTaskSummary,
  BundleInspection
} from "./schema";
import { scanBundles } from "./scan";

export async function generateBenchmarkReport(rootDir: string): Promise<BenchmarkReport> {
  const resolvedRootDir = path.resolve(rootDir);
  const inspections = await scanBundles(resolvedRootDir);
  const ranking = buildRanking(inspections);
  const leaderboard = buildLeaderboard(inspections);
  const tasks = buildTaskSummaries(ranking);
  const scores = inspections
    .map((inspection) => inspection.outcome?.score)
    .filter((score): score is number => score !== undefined);

  return {
    generatedAt: new Date().toISOString(),
    rootDir: resolvedRootDir,
    bundleCount: inspections.length,
    scoredBundleCount: scores.length,
    averageScore: scores.length > 0 ? average(scores) : undefined,
    statusCounts: countStatuses(inspections),
    ranking,
    leaderboard,
    tasks
  };
}

export function renderBenchmarkReportMarkdown(report: BenchmarkReport): string {
  const lines: string[] = [
    "# Benchmark Report",
    "",
    `- Generated: ${report.generatedAt}`,
    `- Root: ${report.rootDir}`,
    `- Bundles: ${report.bundleCount}`,
    `- Scored bundles: ${report.scoredBundleCount}`,
    `- Average score: ${report.averageScore !== undefined ? formatScore(report.averageScore) : "n/a"}`,
    ""
  ];

  lines.push("## Status Counts", "");
  for (const [status, count] of Object.entries(report.statusCounts)) {
    lines.push(`- ${status}: ${count}`);
  }
  lines.push("");

  lines.push("## Ranking", "");
  lines.push("| Rank | Title | Tool | Model | Status | Score | Events | Workspace |");
  lines.push("| --- | --- | --- | --- | --- | --- | --- | --- |");
  for (const entry of report.ranking) {
    lines.push(
      `| ${entry.rank} | ${escapeCell(entry.title)} | ${escapeCell(entry.tool ?? "unknown")} | ${escapeCell(
        entry.model ?? "unknown"
      )} | ${escapeCell(entry.status ?? "unknown")} | ${escapeCell(
        entry.score !== undefined ? formatScore(entry.score) : "n/a"
      )} | ${entry.eventCount} | ${entry.workspaceFileCount} |`
    );
  }
  lines.push("");

  lines.push("## Leaderboard By Tool/Model", "");
  lines.push("| Tool | Model | Runs | Scored | Successes | Avg Score | Best Score |");
  lines.push("| --- | --- | --- | --- | --- | --- | --- |");
  for (const entry of report.leaderboard) {
    lines.push(
      `| ${escapeCell(entry.tool ?? "unknown")} | ${escapeCell(entry.model ?? "unknown")} | ${entry.runs} | ${
        entry.scoredRuns
      } | ${entry.successCount} | ${escapeCell(
        entry.averageScore !== undefined ? formatScore(entry.averageScore) : "n/a"
      )} | ${escapeCell(entry.bestScore !== undefined ? formatScore(entry.bestScore) : "n/a")} |`
    );
  }
  lines.push("");

  lines.push("## Tasks", "");
  for (const task of report.tasks) {
    lines.push(`### ${task.title}`);
    lines.push(`- Runs: ${task.runs}`);
    lines.push(`- Best score: ${task.bestScore !== undefined ? formatScore(task.bestScore) : "n/a"}`);
    if (task.bestRun) {
      lines.push(`- Best run: ${task.bestRun.tool ?? "unknown"} / ${task.bestRun.model ?? "unknown"}`);
    }
    lines.push("");
  }

  return `${lines.join("\n").trim()}\n`;
}

function buildRanking(inspections: BundleInspection[]): BenchmarkRunEntry[] {
  const sorted = [...inspections].sort((left, right) => compareInspections(left, right));

  return sorted.map((inspection, index) => ({
    rank: index + 1,
    title: inspection.title,
    bundleDir: inspection.bundleDir,
    tool: inspection.tool,
    model: inspection.model,
    status: inspection.outcome?.status,
    score: inspection.outcome?.score,
    repo: inspection.repo,
    commit: inspection.commit,
    branch: inspection.branch,
    eventCount: inspection.eventCount,
    workspaceFileCount: inspection.workspaceFileCount,
    promptSource: inspection.promptSource
  }));
}

function buildLeaderboard(inspections: BundleInspection[]): BenchmarkLeaderboardEntry[] {
  const groups = new Map<string, BundleInspection[]>();

  for (const inspection of inspections) {
    const key = `${inspection.tool ?? "unknown"}::${inspection.model ?? "unknown"}`;
    const group = groups.get(key) ?? [];
    group.push(inspection);
    groups.set(key, group);
  }

  return [...groups.entries()]
    .map(([key, group]) => {
      const scores = group
        .map((inspection) => inspection.outcome?.score)
        .filter((score): score is number => score !== undefined);

      return {
        key,
        tool: group[0]?.tool,
        model: group[0]?.model,
        runs: group.length,
        scoredRuns: scores.length,
        successCount: group.filter((inspection) => inspection.outcome?.status === "success").length,
        averageScore: scores.length > 0 ? average(scores) : undefined,
        bestScore: scores.length > 0 ? Math.max(...scores) : undefined
      };
    })
    .sort((left, right) => {
      const scoreDelta = (right.averageScore ?? -Infinity) - (left.averageScore ?? -Infinity);
      if (scoreDelta !== 0) {
        return scoreDelta;
      }

      return right.successCount - left.successCount;
    });
}

function buildTaskSummaries(ranking: BenchmarkRunEntry[]): BenchmarkTaskSummary[] {
  const grouped = new Map<string, BenchmarkRunEntry[]>();

  for (const entry of ranking) {
    const group = grouped.get(entry.title) ?? [];
    group.push(entry);
    grouped.set(entry.title, group);
  }

  return [...grouped.entries()].map(([title, runs]) => {
    const bestRun = runs.find((run) => run.score !== undefined) ?? runs[0];

    return {
      title,
      runs: runs.length,
      bestScore: bestRun?.score,
      bestRun
    };
  });
}

function countStatuses(inspections: BundleInspection[]): Record<string, number> {
  const counts: Record<string, number> = {};

  for (const inspection of inspections) {
    const status = inspection.outcome?.status ?? "unknown";
    counts[status] = (counts[status] ?? 0) + 1;
  }

  return counts;
}

function compareInspections(left: BundleInspection, right: BundleInspection): number {
  const scoreDelta = (right.outcome?.score ?? -Infinity) - (left.outcome?.score ?? -Infinity);
  if (scoreDelta !== 0) {
    return scoreDelta;
  }

  const statusDelta = statusWeight(right.outcome?.status) - statusWeight(left.outcome?.status);
  if (statusDelta !== 0) {
    return statusDelta;
  }

  return left.title.localeCompare(right.title);
}

function statusWeight(status: "success" | "partial" | "failure" | undefined): number {
  switch (status) {
    case "success":
      return 3;
    case "partial":
      return 2;
    case "failure":
      return 1;
    default:
      return 0;
  }
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatScore(value: number): string {
  return Number(value.toFixed(4)).toString();
}

function escapeCell(value: string): string {
  return value.replace(/\|/g, "\\|");
}
