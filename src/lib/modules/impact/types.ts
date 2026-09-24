import type { ComparisonVerdict, MetricComparison } from "@/lib/modules/verifications/score";

export type RouteSnapshot = {
  method: string;
  route: string;
  count: number;
  errors: number;
  latencyP50: number;
  latencyP95: number;
};

export type RouteFingerprint = {
  method: string;
  route: string;
  count: number;
  errorRate: number;
  latencyP50: number;
  latencyP95: number;
};

export type ProcessFingerprint = {
  cpu: number;
  memory: number;
  latency: number;
  errors: number;
};

export type ServiceFingerprint = {
  serviceId: string;
  capturedAt: string;
  windowDays: number;
  sampleSize: number;
  process: ProcessFingerprint | null;
  routes: RouteFingerprint[];
};

export type ImpactVerdict = "ok" | "warn" | "regress" | "insufficient";

export type ImpactFinding = {
  id: string;
  route: string | null;
  metric: string;
  baseline: number;
  observed: number;
  deltaPercent: number;
  thresholdPercent: number;
  verdict: ComparisonVerdict;
  fileHint: string | null;
  retry: string;
};

export type ImpactReport = {
  verdict: ImpactVerdict;
  summary: string;
  fingerprint: ServiceFingerprint | null;
  comparisons: MetricComparison[];
  findings: ImpactFinding[];
};
