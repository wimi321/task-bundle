import path from "node:path";
import { Command } from "commander";
import { BenchmarkBadgeMetric, renderBenchmarkBadge } from "../../core/badge";
import { generateBenchmarkReport } from "../../core/report";
import { writeTextFile } from "../../utils/fs";

const supportedMetrics: BenchmarkBadgeMetric[] = ["avg-score", "success-rate", "runs", "best-model"];

export function registerBadgeCommand(program: Command): void {
  program
    .command("badge")
    .description("Generate a shareable SVG badge from a directory of bundles.")
    .requiredOption("--out <file>", "Write the SVG badge to a file")
    .option("--metric <metric>", "Metric: avg-score, success-rate, runs, best-model", "avg-score")
    .argument("<rootDir>", "Directory that contains bundle folders")
    .action(async (rootDir: string, options: { out: string; metric: string }) => {
      const metric = parseMetric(options.metric);
      const report = await generateBenchmarkReport(path.resolve(rootDir));
      const svg = renderBenchmarkBadge(report, metric);
      const outputPath = path.resolve(options.out);

      await writeTextFile(outputPath, svg);
      console.log(`Badge: ${outputPath}`);
    });
}

function parseMetric(value: string): BenchmarkBadgeMetric {
  if (supportedMetrics.includes(value as BenchmarkBadgeMetric)) {
    return value as BenchmarkBadgeMetric;
  }

  throw new Error(`Unsupported badge metric: ${value}. Choose one of ${supportedMetrics.join(", ")}.`);
}
