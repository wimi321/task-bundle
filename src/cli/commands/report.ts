import path from "node:path";
import { Command } from "commander";
import { generateBenchmarkReport, renderBenchmarkReportMarkdown } from "../../core/report";
import { writeTextFile } from "../../utils/fs";
import { printKeyValue } from "../../utils/output";

export function registerReportCommand(program: Command): void {
  program
    .command("report")
    .description("Generate a benchmark-style report for a directory of bundles.")
    .option("--json", "Print machine-readable JSON instead of text")
    .option("--out <file>", "Write a Markdown report to a file")
    .argument("<rootDir>", "Directory that contains bundle folders")
    .action(async (rootDir: string, options: { json?: boolean; out?: string }) => {
      const report = await generateBenchmarkReport(path.resolve(rootDir));

      if (options.out) {
        const markdown = renderBenchmarkReportMarkdown(report);
        await writeTextFile(path.resolve(options.out), markdown);
      }

      if (options.json) {
        console.log(JSON.stringify(report, null, 2));
        return;
      }

      console.log("Task Bundle Benchmark Report");
      console.log("----------------------------");
      printKeyValue("Root", report.rootDir);
      printKeyValue("Bundles", String(report.bundleCount));
      printKeyValue("Scored bundles", String(report.scoredBundleCount));
      printKeyValue("Average score", report.averageScore !== undefined ? Number(report.averageScore.toFixed(4)).toString() : "n/a");
      console.log("");
      console.log("Ranking");
      for (const entry of report.ranking) {
        console.log(
          `${entry.rank}. ${entry.title} | ${entry.tool ?? "unknown"} / ${entry.model ?? "unknown"} | ${
            entry.status ?? "unknown"
          } | score ${entry.score !== undefined ? Number(entry.score.toFixed(4)).toString() : "n/a"}`
        );
      }
      console.log("");
      console.log("Leaderboard");
      for (const entry of report.leaderboard) {
        console.log(
          `- ${entry.tool ?? "unknown"} / ${entry.model ?? "unknown"} | runs ${entry.runs} | avg ${
            entry.averageScore !== undefined ? Number(entry.averageScore.toFixed(4)).toString() : "n/a"
          } | best ${entry.bestScore !== undefined ? Number(entry.bestScore.toFixed(4)).toString() : "n/a"}`
        );
      }

      if (options.out) {
        console.log("");
        console.log(`Markdown report: ${path.resolve(options.out)}`);
      }
    });
}
