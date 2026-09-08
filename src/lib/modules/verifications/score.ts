export type ComparisonVerdict = "PASS" | "WARN" | "FAIL";

export type MetricComparison = {
  metric: string;
  baseline: number;
  observed: number;
  deltaPercent: number;
  thresholdPercent: number;
  verdict: ComparisonVerdict;
};

const VERDICT_SCORE: Record<ComparisonVerdict, number> = {
  PASS: 100,
  WARN: 70,
  FAIL: 0,
};

export function isMetricComparison(value: unknown): value is MetricComparison {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.metric === "string" &&
    typeof entry.baseline === "number" &&
    typeof entry.observed === "number" &&
    typeof entry.deltaPercent === "number" &&
    typeof entry.thresholdPercent === "number" &&
    (entry.verdict === "PASS" || entry.verdict === "WARN" || entry.verdict === "FAIL")
  );
}

export function parseComparisons(value: unknown): MetricComparison[] {
  return Array.isArray(value) ? value.filter(isMetricComparison) : [];
}

/** Display-only score from comparison verdicts. The worker still decides PASS/WARN/FAIL. */
export function scoreFromComparisons(comparisons: MetricComparison[]): number | null {
  if (!comparisons.length) return null;
  const total = comparisons.reduce((sum, comparison) => sum + VERDICT_SCORE[comparison.verdict], 0);
  return Math.round(total / comparisons.length);
}
