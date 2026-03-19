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

export function renderBenchmarkReportHtml(report: BenchmarkReport): string {
  const summaryCards = [
    renderSummaryCard("Bundles", String(report.bundleCount)),
    renderSummaryCard("Scored bundles", String(report.scoredBundleCount)),
    renderSummaryCard(
      "Average score",
      report.averageScore !== undefined ? formatScore(report.averageScore) : "n/a"
    ),
    renderSummaryCard("Tasks", String(report.tasks.length))
  ].join("\n");

  const statusPills = Object.entries(report.statusCounts)
    .sort(([left], [right]) => compareStatusLabels(left, right))
    .map(([status, count]) => {
      const safeStatus = escapeHtml(status);
      return `<span class="pill status-${statusClassName(status)}"><span>${safeStatus}</span><strong>${count}</strong></span>`;
    })
    .join("\n");

  const rankingRows =
    report.ranking.length > 0
      ? report.ranking
          .map((entry) => {
            const scoreLabel = entry.score !== undefined ? formatScore(entry.score) : "n/a";
            const scoreWidth = entry.score !== undefined ? clamp(Math.round(entry.score * 100), 0, 100) : 0;

            return [
              "<tr>",
              `  <td>${entry.rank}</td>`,
              "  <td>",
              '    <div class="title-cell">',
              `      <strong>${escapeHtml(entry.title)}</strong>`,
              `      <span>${escapeHtml(entry.bundleDir)}</span>`,
              "    </div>",
              "  </td>",
              `  <td>${escapeHtml(entry.tool ?? "unknown")}</td>`,
              `  <td>${escapeHtml(entry.model ?? "unknown")}</td>`,
              `  <td><span class="pill status-${statusClassName(entry.status)}">${escapeHtml(
                entry.status ?? "unknown"
              )}</span></td>`,
              "  <td>",
              '    <div class="score-cell">',
              `      <strong>${scoreLabel}</strong>`,
              '      <div class="score-track" aria-hidden="true">',
              `        <span style="width: ${scoreWidth}%"></span>`,
              "      </div>",
              "    </div>",
              "  </td>",
              `  <td>${entry.eventCount}</td>`,
              `  <td>${entry.workspaceFileCount}</td>`,
              "</tr>"
            ].join("\n");
          })
          .join("\n")
      : '<tr><td colspan="8" class="empty">No bundles found in this directory.</td></tr>';

  const leaderboardCards =
    report.leaderboard.length > 0
      ? report.leaderboard
          .map((entry) =>
            [
              '<article class="metric-card">',
              '  <div class="metric-card-header">',
              "    <div>",
              '      <p class="eyebrow">Tool / Model</p>',
              `      <h3>${escapeHtml(entry.tool ?? "unknown")} / ${escapeHtml(entry.model ?? "unknown")}</h3>`,
              "    </div>",
              `    <span class="pill">${entry.runs} run${entry.runs === 1 ? "" : "s"}</span>`,
              "  </div>",
              '  <dl class="metric-grid">',
              `    <div><dt>Average</dt><dd>${entry.averageScore !== undefined ? formatScore(entry.averageScore) : "n/a"}</dd></div>`,
              `    <div><dt>Best</dt><dd>${entry.bestScore !== undefined ? formatScore(entry.bestScore) : "n/a"}</dd></div>`,
              `    <div><dt>Successes</dt><dd>${entry.successCount}</dd></div>`,
              `    <div><dt>Scored runs</dt><dd>${entry.scoredRuns}</dd></div>`,
              "  </dl>",
              "</article>"
            ].join("\n")
          )
          .join("\n")
      : '<p class="empty-block">No leaderboard data yet.</p>';

  const taskCards =
    report.tasks.length > 0
      ? report.tasks
          .map((task) => {
            const bestRun = task.bestRun
              ? `${escapeHtml(task.bestRun.tool ?? "unknown")} / ${escapeHtml(task.bestRun.model ?? "unknown")}`
              : "n/a";

            return [
              '<article class="task-card">',
              '  <p class="eyebrow">Task</p>',
              `  <h3>${escapeHtml(task.title)}</h3>`,
              '  <dl class="task-meta">',
              `    <div><dt>Runs</dt><dd>${task.runs}</dd></div>`,
              `    <div><dt>Best score</dt><dd>${task.bestScore !== undefined ? formatScore(task.bestScore) : "n/a"}</dd></div>`,
              `    <div class="task-best-run"><dt>Best run</dt><dd>${bestRun}</dd></div>`,
              "  </dl>",
              "</article>"
            ].join("\n");
          })
          .join("\n")
      : '<p class="empty-block">No task summaries yet.</p>';

  return [
    "<!doctype html>",
    '<html lang="en">',
    "  <head>",
    '    <meta charset="utf-8" />',
    '    <meta name="viewport" content="width=device-width, initial-scale=1" />',
    '    <title>Task Bundle Benchmark Report</title>',
    "    <style>",
    renderBenchmarkReportCss(),
    "    </style>",
    "  </head>",
    "  <body>",
    '    <main class="page">',
    '      <section class="hero">',
    '        <div class="hero-copy">',
    '          <p class="hero-kicker">Task Bundle</p>',
    "          <h1>Benchmark Report</h1>",
    '          <p class="hero-text">A portable, browser-ready summary for comparing AI coding task bundles without setting up a heavier benchmark stack.</p>',
    "        </div>",
    '        <div class="hero-meta">',
    `          <div class="meta-line"><span>Generated</span><strong>${escapeHtml(formatTimestamp(report.generatedAt))}</strong></div>`,
    `          <div class="meta-line"><span>Root</span><strong>${escapeHtml(report.rootDir)}</strong></div>`,
    "        </div>",
    "      </section>",
    '      <section class="summary-grid">',
    summaryCards,
    "      </section>",
    '      <section class="section">',
    '        <div class="section-header">',
    "          <div>",
    '            <p class="eyebrow">Outcome mix</p>',
    "            <h2>Status Counts</h2>",
    "          </div>",
    "        </div>",
    `        <div class="pill-row">${statusPills || '<span class="pill">No statuses</span>'}</div>`,
    "      </section>",
    '      <section class="section">',
    '        <div class="section-header">',
    "          <div>",
    '            <p class="eyebrow">Ranked runs</p>',
    "            <h2>Ranking</h2>",
    "          </div>",
    '          <p class="section-text">Sorted by score first, then by outcome status and title.</p>',
    "        </div>",
    '        <div class="table-shell">',
    "          <table>",
    "            <thead>",
    "              <tr>",
    "                <th>Rank</th>",
    "                <th>Title</th>",
    "                <th>Tool</th>",
    "                <th>Model</th>",
    "                <th>Status</th>",
    "                <th>Score</th>",
    "                <th>Events</th>",
    "                <th>Workspace</th>",
    "              </tr>",
    "            </thead>",
    "            <tbody>",
    rankingRows,
    "            </tbody>",
    "          </table>",
    "        </div>",
    "      </section>",
    '      <section class="section">',
    '        <div class="section-header">',
    "          <div>",
    '            <p class="eyebrow">Aggregate view</p>',
    "            <h2>Leaderboard by Tool / Model</h2>",
    "          </div>",
    '          <p class="section-text">Use this to compare repeated runs across agents, models, or internal tools.</p>',
    "        </div>",
    `        <div class="card-grid">${leaderboardCards}</div>`,
    "      </section>",
    '      <section class="section">',
    '        <div class="section-header">',
    "          <div>",
    '            <p class="eyebrow">Task breakdown</p>',
    "            <h2>Task Summaries</h2>",
    "          </div>",
    '          <p class="section-text">Each card shows how many runs exist for a task and which run performed best.</p>',
    "        </div>",
    `        <div class="task-grid">${taskCards}</div>`,
    "      </section>",
    '      <footer class="footer">Generated with <code>taskbundle report --html-out</code>.</footer>',
    "    </main>",
    "  </body>",
    "</html>",
    ""
  ].join("\n");
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

function compareStatusLabels(left: string, right: string): number {
  return statusWeight(labelToStatus(right)) - statusWeight(labelToStatus(left)) || left.localeCompare(right);
}

function labelToStatus(value: string): "success" | "partial" | "failure" | undefined {
  switch (value) {
    case "success":
      return "success";
    case "partial":
      return "partial";
    case "failure":
      return "failure";
    default:
      return undefined;
  }
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

function renderSummaryCard(label: string, value: string): string {
  return [
    '<article class="summary-card">',
    `  <p>${escapeHtml(label)}</p>`,
    `  <strong>${escapeHtml(value)}</strong>`,
    "</article>"
  ].join("\n");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function statusClassName(status: string | undefined): string {
  switch (status) {
    case "success":
      return "success";
    case "partial":
      return "partial";
    case "failure":
      return "failure";
    default:
      return "unknown";
  }
}

function formatTimestamp(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return `${parsed.toISOString().replace(".000Z", "Z")} UTC`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function renderBenchmarkReportCss(): string {
  return `
      :root {
        color-scheme: light;
        --page-bg: #f6f2e8;
        --paper: rgba(255, 252, 246, 0.84);
        --paper-strong: rgba(255, 252, 246, 0.96);
        --ink: #17211f;
        --muted: #5b6663;
        --line: rgba(23, 33, 31, 0.12);
        --shadow: 0 24px 70px rgba(34, 39, 36, 0.14);
        --teal: #0f766e;
        --teal-soft: rgba(15, 118, 110, 0.14);
        --gold: #b7791f;
        --gold-soft: rgba(183, 121, 31, 0.14);
        --rose: #b42318;
        --rose-soft: rgba(180, 35, 24, 0.14);
        --slate: #344054;
        --slate-soft: rgba(52, 64, 84, 0.12);
      }

      * {
        box-sizing: border-box;
      }

      html {
        background:
          radial-gradient(circle at top left, rgba(15, 118, 110, 0.16), transparent 26rem),
          radial-gradient(circle at top right, rgba(202, 90, 46, 0.2), transparent 24rem),
          linear-gradient(180deg, #fcfaf5 0%, var(--page-bg) 100%);
      }

      body {
        margin: 0;
        min-height: 100vh;
        color: var(--ink);
        font-family: "Avenir Next", "Segoe UI", "Helvetica Neue", sans-serif;
      }

      code {
        font-family: "SFMono-Regular", "Consolas", "Liberation Mono", monospace;
        background: rgba(23, 33, 31, 0.06);
        border-radius: 999px;
        padding: 0.14rem 0.45rem;
      }

      .page {
        width: min(1180px, calc(100% - 32px));
        margin: 0 auto;
        padding: 32px 0 56px;
      }

      .hero,
      .section,
      .summary-card,
      .metric-card,
      .task-card {
        backdrop-filter: blur(14px);
      }

      .hero,
      .section {
        background: var(--paper);
        border: 1px solid rgba(255, 255, 255, 0.5);
        border-radius: 28px;
        box-shadow: var(--shadow);
      }

      .hero {
        display: grid;
        gap: 24px;
        grid-template-columns: minmax(0, 1.8fr) minmax(260px, 1fr);
        padding: 32px;
        margin-bottom: 22px;
      }

      .hero-kicker,
      .eyebrow {
        margin: 0 0 12px;
        font-size: 0.77rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--muted);
      }

      .hero h1,
      .section h2,
      .metric-card h3,
      .task-card h3 {
        font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Georgia, serif;
        letter-spacing: -0.02em;
      }

      .hero h1 {
        margin: 0;
        font-size: clamp(2.4rem, 5vw, 4.4rem);
        line-height: 0.95;
      }

      .hero-text,
      .section-text,
      .title-cell span,
      .footer {
        color: var(--muted);
      }

      .hero-text {
        max-width: 40rem;
        margin: 14px 0 0;
        font-size: 1.04rem;
        line-height: 1.6;
      }

      .hero-meta {
        display: grid;
        gap: 14px;
        align-content: start;
      }

      .meta-line {
        padding: 16px 18px;
        background: var(--paper-strong);
        border: 1px solid var(--line);
        border-radius: 18px;
      }

      .meta-line span,
      .summary-card p,
      .metric-grid dt,
      .task-meta dt {
        display: block;
        margin-bottom: 8px;
        color: var(--muted);
        font-size: 0.86rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
      }

      .meta-line strong,
      .summary-card strong {
        font-size: 1.05rem;
        line-height: 1.4;
      }

      .summary-grid,
      .card-grid,
      .task-grid {
        display: grid;
        gap: 16px;
      }

      .summary-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
        margin-bottom: 22px;
      }

      .summary-card,
      .metric-card,
      .task-card {
        background: var(--paper-strong);
        border: 1px solid var(--line);
        border-radius: 22px;
        box-shadow: var(--shadow);
      }

      .summary-card {
        padding: 18px 20px;
      }

      .summary-card strong {
        font-size: clamp(1.7rem, 4vw, 2.3rem);
        line-height: 1.05;
      }

      .section {
        padding: 24px;
        margin-bottom: 22px;
      }

      .section-header,
      .metric-card-header {
        display: flex;
        gap: 16px;
        justify-content: space-between;
        align-items: flex-start;
      }

      .section h2,
      .metric-card h3,
      .task-card h3 {
        margin: 0;
      }

      .section h2 {
        font-size: clamp(1.7rem, 3vw, 2.4rem);
      }

      .section-text {
        max-width: 30rem;
        margin: 0;
        line-height: 1.55;
      }

      .pill-row {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }

      .pill {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 0.55rem 0.8rem;
        border-radius: 999px;
        background: rgba(23, 33, 31, 0.06);
        border: 1px solid rgba(23, 33, 31, 0.08);
        font-size: 0.92rem;
      }

      .status-success {
        background: var(--teal-soft);
        color: var(--teal);
        border-color: rgba(15, 118, 110, 0.22);
      }

      .status-partial {
        background: var(--gold-soft);
        color: var(--gold);
        border-color: rgba(183, 121, 31, 0.22);
      }

      .status-failure {
        background: var(--rose-soft);
        color: var(--rose);
        border-color: rgba(180, 35, 24, 0.22);
      }

      .status-unknown {
        background: var(--slate-soft);
        color: var(--slate);
        border-color: rgba(52, 64, 84, 0.18);
      }

      .table-shell {
        margin-top: 18px;
        overflow-x: auto;
        border-radius: 22px;
        border: 1px solid var(--line);
        background: var(--paper-strong);
      }

      table {
        width: 100%;
        border-collapse: collapse;
        min-width: 760px;
      }

      th,
      td {
        padding: 14px 16px;
        text-align: left;
        vertical-align: top;
        border-bottom: 1px solid var(--line);
      }

      th {
        background: rgba(23, 33, 31, 0.04);
        font-size: 0.84rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--muted);
      }

      tbody tr:last-child td {
        border-bottom: none;
      }

      tbody tr:nth-child(even) td {
        background: rgba(255, 255, 255, 0.38);
      }

      .title-cell {
        display: grid;
        gap: 6px;
      }

      .title-cell strong {
        line-height: 1.35;
      }

      .title-cell span {
        font-size: 0.84rem;
        word-break: break-all;
      }

      .score-cell {
        display: grid;
        gap: 8px;
        min-width: 116px;
      }

      .score-track {
        width: 100%;
        height: 8px;
        border-radius: 999px;
        background: rgba(23, 33, 31, 0.08);
        overflow: hidden;
      }

      .score-track span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #0f766e 0%, #ca5a2e 100%);
      }

      .card-grid {
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        margin-top: 18px;
      }

      .metric-card,
      .task-card {
        padding: 20px;
      }

      .metric-card h3,
      .task-card h3 {
        font-size: 1.42rem;
        line-height: 1.15;
      }

      .metric-grid,
      .task-meta {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
        margin: 20px 0 0;
      }

      .metric-grid div,
      .task-meta div {
        padding: 14px;
        border-radius: 16px;
        background: rgba(23, 33, 31, 0.04);
        border: 1px solid rgba(23, 33, 31, 0.06);
      }

      .metric-grid dd,
      .task-meta dd {
        margin: 0;
        font-size: 1.16rem;
        font-weight: 700;
      }

      .task-grid {
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        margin-top: 18px;
      }

      .task-best-run {
        grid-column: 1 / -1;
      }

      .empty,
      .empty-block {
        color: var(--muted);
      }

      .empty {
        text-align: center;
        padding: 26px 16px;
      }

      .empty-block {
        margin: 18px 0 0;
        padding: 20px;
        border-radius: 18px;
        background: rgba(23, 33, 31, 0.04);
        border: 1px dashed rgba(23, 33, 31, 0.16);
      }

      .footer {
        text-align: center;
        padding-top: 8px;
        font-size: 0.95rem;
      }

      @media (max-width: 920px) {
        .hero {
          grid-template-columns: 1fr;
        }

        .summary-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 640px) {
        .page {
          width: min(100% - 20px, 100%);
          padding-top: 20px;
          padding-bottom: 36px;
        }

        .hero,
        .section {
          border-radius: 22px;
          padding: 20px;
        }

        .summary-grid,
        .metric-grid,
        .task-meta {
          grid-template-columns: 1fr;
        }

        .metric-card,
        .task-card,
        .summary-card {
          border-radius: 18px;
        }
      }
  `.trim();
}
