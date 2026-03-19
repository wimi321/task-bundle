import { BenchmarkReport } from "./schema";

export type BenchmarkBadgeMetric = "avg-score" | "success-rate" | "runs" | "best-model";

interface BadgeSpec {
  label: string;
  value: string;
  color: string;
}

export function renderBenchmarkBadge(report: BenchmarkReport, metric: BenchmarkBadgeMetric): string {
  const spec = buildBadgeSpec(report, metric);
  const labelWidth = measureTextWidth(spec.label);
  const valueWidth = measureTextWidth(spec.value);
  const totalWidth = labelWidth + valueWidth;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="28" role="img" aria-label="${escapeXml(
    `${spec.label}: ${spec.value}`
  )}">
  <title>${escapeXml(`${spec.label}: ${spec.value}`)}</title>
  <defs>
    <linearGradient id="valueFill" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="${spec.color}" />
      <stop offset="100%" stop-color="${darkenColor(spec.color, 0.16)}" />
    </linearGradient>
  </defs>
  <rect width="${totalWidth}" height="28" rx="14" fill="#efe7dc" />
  <rect width="${labelWidth}" height="28" rx="14" fill="#31261f" />
  <rect x="${labelWidth}" width="${valueWidth}" height="28" rx="14" fill="url(#valueFill)" />
  <rect x="${labelWidth}" width="1" height="28" fill="rgba(255,255,255,0.16)" />
  <g fill="#fff8f1" text-anchor="middle" font-family="Avenir Next, Segoe UI, Helvetica Neue, sans-serif" font-size="12" font-weight="700">
    <text x="${labelWidth / 2}" y="18">${escapeXml(spec.label)}</text>
    <text x="${labelWidth + valueWidth / 2}" y="18">${escapeXml(spec.value)}</text>
  </g>
</svg>
`;
}

function buildBadgeSpec(report: BenchmarkReport, metric: BenchmarkBadgeMetric): BadgeSpec {
  switch (metric) {
    case "avg-score": {
      const value = report.averageScore !== undefined ? formatScore(report.averageScore) : "n/a";
      const numeric = report.averageScore;

      return {
        label: "avg score",
        value,
        color: numeric === undefined ? "#667085" : numeric >= 0.9 ? "#0f766e" : numeric >= 0.75 ? "#b7791f" : "#b42318"
      };
    }
    case "success-rate": {
      const successes = report.statusCounts.success ?? 0;
      const rate = report.bundleCount > 0 ? successes / report.bundleCount : undefined;

      return {
        label: "success rate",
        value: rate !== undefined ? `${Math.round(rate * 100)}%` : "n/a",
        color: rate === undefined ? "#667085" : rate >= 0.8 ? "#0f766e" : rate >= 0.5 ? "#b7791f" : "#b42318"
      };
    }
    case "runs":
      return {
        label: "runs",
        value: String(report.bundleCount),
        color: "#344054"
      };
    case "best-model": {
      const best = report.leaderboard[0];
      const label = best?.model ?? best?.tool ?? "n/a";

      return {
        label: "best model",
        value: label,
        color: "#ca5a2e"
      };
    }
    default:
      return assertNever(metric);
  }
}

function formatScore(value: number): string {
  return Number(value.toFixed(4)).toString();
}

function measureTextWidth(value: string): number {
  return Math.max(72, Math.round(value.length * 7.6 + 26));
}

function darkenColor(color: string, amount: number): string {
  const normalized = color.replace("#", "");
  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  return `#${[red, green, blue]
    .map((channel) => Math.max(0, Math.min(255, Math.round(channel * (1 - amount)))))
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function assertNever(value: never): never {
  throw new Error(`Unsupported badge metric: ${String(value)}`);
}
