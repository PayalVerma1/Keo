import type { ComparisonVerdict, MetricComparison } from "@/lib/modules/verifications/score";
import { hintFile, routeKey } from "./routes";
import type {
  ImpactFinding,
  ImpactReport,
  ImpactVerdict,
  ProcessFingerprint,
  RouteSnapshot,
  ServiceFingerprint,
} from "./types";

export const DEFAULT_THRESHOLDS = { cpu: 20, memory: 20, latency: 15, errors: 10, latencyP95: 15, errorRate: 10 };

type Thresholds = typeof DEFAULT_THRESHOLDS;

const thresholdOf = (thresholds: Record<string, unknown>, key: keyof Thresholds) =>
  typeof thresholds[key] === "number" ? (thresholds[key] as number) : DEFAULT_THRESHOLDS[key];

const deltaPercent = (baseline: number, observed: number) => {
  if (baseline === 0) return observed === 0 ? 0 : 100;
  return ((observed - baseline) / baseline) * 100;
};

const verdictFor = (delta: number, threshold: number): ComparisonVerdict =>
  delta > threshold ? "FAIL" : delta > threshold * 0.75 ? "WARN" : "PASS";

const impactFromComparisons = (comparisons: MetricComparison[]): ImpactVerdict => {
  if (!comparisons.length) return "insufficient";
  if (comparisons.some((row) => row.verdict === "FAIL")) return "regress";
  if (comparisons.some((row) => row.verdict === "WARN")) return "warn";
  return "ok";
};

const comparison = (
  metric: string,
  baseline: number,
  observed: number,
  thresholdPercent: number
): MetricComparison => {
  const delta = Number(deltaPercent(baseline, observed).toFixed(2));
  return {
    metric,
    baseline: Number(baseline.toFixed(4)),
    observed: Number(observed.toFixed(4)),
    deltaPercent: delta,
    thresholdPercent,
    verdict: verdictFor(delta, thresholdPercent),
  };
};

export function compareToFingerprint(input: {
  fingerprint: ServiceFingerprint;
  process: ProcessFingerprint | null;
  routes: RouteSnapshot[];
  thresholds?: Record<string, unknown>;
  changedFiles?: string[];
}): ImpactReport {
  const { fingerprint, process, routes, thresholds = {}, changedFiles = [] } = input;
  const comparisons: MetricComparison[] = [];

  if (fingerprint.process && process) {
    (["cpu", "memory", "latency", "errors"] as const).forEach((key) => {
      comparisons.push(
        comparison(key, fingerprint.process![key], process[key], thresholdOf(thresholds, key === "latency" ? "latency" : key))
      );
    });
  }

  const baselineByKey = new Map(
    fingerprint.routes.map((route) => [routeKey(route.method, route.route), route] as const)
  );

  for (const observed of routes) {
    const baseline = baselineByKey.get(routeKey(observed.method, observed.route));
    if (!baseline) continue;
    const errorRate = observed.count > 0 ? (observed.errors / observed.count) * 100 : 0;
    const label = routeKey(observed.method, observed.route);
    comparisons.push(
      comparison(`${label} p95`, baseline.latencyP95, observed.latencyP95, thresholdOf(thresholds, "latencyP95"))
    );
    comparisons.push(
      comparison(`${label} errors`, baseline.errorRate, errorRate, thresholdOf(thresholds, "errorRate"))
    );
  }

  const findings: ImpactFinding[] = comparisons
    .filter((row) => row.verdict !== "PASS")
    .map((row, index) => {
      const routeMatch = row.metric.match(/^(GET|POST|PUT|PATCH|DELETE) (.+) (p95|errors)$/);
      const route = routeMatch ? `${routeMatch[1]} ${routeMatch[2]}` : null;
      const kind = routeMatch?.[3] ?? row.metric;
      const retry =
        kind === "p95" || row.metric === "latency"
          ? `Reduce latency on ${route ?? row.metric}: observed ${row.observed} vs prod ${row.baseline} (${row.deltaPercent > 0 ? "+" : ""}${row.deltaPercent}%).`
          : `Stop errors on ${route ?? row.metric}: observed ${row.observed} vs prod ${row.baseline} (${row.deltaPercent > 0 ? "+" : ""}${row.deltaPercent}%).`;
      return {
        id: `finding-${index + 1}`,
        route,
        metric: row.metric,
        baseline: row.baseline,
        observed: row.observed,
        deltaPercent: row.deltaPercent,
        thresholdPercent: row.thresholdPercent,
        verdict: row.verdict,
        fileHint: hintFile(route, changedFiles),
        retry,
      };
    });

  const verdict = !process && !routes.length ? "insufficient" : impactFromComparisons(comparisons);
  const failed = findings.filter((finding) => finding.verdict === "FAIL");
  const summary =
    verdict === "insufficient"
      ? "Not enough observed telemetry to compare against the production fingerprint. Instrument the app with the SDK or pass observed.routes."
      : failed.length
        ? `regress: ${failed.map((finding) => `${finding.metric} ${finding.deltaPercent > 0 ? "+" : ""}${finding.deltaPercent}%`).join(", ")}.`
        : findings.length
          ? `warn: ${findings.map((finding) => finding.metric).join(", ")}.`
          : `ok: ${comparisons.length} checks within the production fingerprint.`;

  return { verdict, summary, fingerprint, comparisons, findings };
}

export function fingerprintHasContract(fingerprint: ServiceFingerprint) {
  return Boolean(fingerprint.process) || fingerprint.routes.length > 0;
}
