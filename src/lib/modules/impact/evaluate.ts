import { prisma } from "../../config/prisma";
import { compareToFingerprint, fingerprintHasContract } from "./compare";
import { buildFingerprint, observedFromMetricRows } from "./fingerprint";
import { parseRouteSnapshots } from "./routes";
import { enrichFindingsWithModel, recommendationsFromReport } from "./rca";
import type { ImpactReport, ProcessFingerprint, RouteSnapshot } from "./types";

export type WouldThisRegressInput = {
  serviceId: string;
  baselineServiceId?: string;
  observed?: {
    cpu?: number;
    memory?: number;
    latency?: number;
    errors?: number;
    routes?: unknown;
  };
  jobId?: string;
  changedFiles?: string[];
  diff?: string;
  thresholds?: Record<string, unknown>;
  explain?: boolean;
};

const processFromObserved = (observed: WouldThisRegressInput["observed"]): ProcessFingerprint | null => {
  if (!observed) return null;
  if (
    typeof observed.cpu !== "number" &&
    typeof observed.memory !== "number" &&
    typeof observed.latency !== "number" &&
    typeof observed.errors !== "number"
  ) {
    return null;
  }
  return {
    cpu: Number(observed.cpu) || 0,
    memory: Number(observed.memory) || 0,
    latency: Number(observed.latency) || 0,
    errors: Number(observed.errors) || 0,
  };
};

export async function wouldThisRegress(input: WouldThisRegressInput): Promise<ImpactReport> {
  const baselineServiceId = input.baselineServiceId ?? input.serviceId;
  let process = processFromObserved(input.observed);
  let routes: RouteSnapshot[] = parseRouteSnapshots(input.observed?.routes);

  if (input.jobId) {
    const job = await prisma.verificationJob.findFirst({
      where: { id: input.jobId, serviceId: input.serviceId },
    });
    if (!job) {
      return {
        verdict: "insufficient",
        summary: "Verification job not found for this service.",
        fingerprint: null,
        comparisons: [],
        findings: [],
      };
    }
    const rows = await prisma.metrics.findMany({
      where: { serviceId: job.serviceId, verificationJobId: job.id },
      select: { cpu: true, memory: true, latency: true, errors: true, routes: true },
    });
    const fromJob = observedFromMetricRows(rows);
    process = fromJob.process ?? process;
    if (!routes.length) routes = fromJob.routes;
  }

  const fingerprint = await buildFingerprint(baselineServiceId);
  if (!fingerprintHasContract(fingerprint)) {
    return {
      verdict: "insufficient",
      summary: "No production fingerprint yet. Run the SDK in production so Keo can learn p95 and errors per route.",
      fingerprint,
      comparisons: [],
      findings: [],
    };
  }

  if (!process && !routes.length) {
    return {
      verdict: "insufficient",
      summary:
        "Fingerprint is ready. Pass observed.routes (and optional process metrics) from a local or preview run, or a jobId with SDK telemetry.",
      fingerprint,
      comparisons: [],
      findings: [],
    };
  }

  let report = compareToFingerprint({
    fingerprint,
    process,
    routes,
    thresholds: input.thresholds,
    changedFiles: input.changedFiles,
  });

  if (input.explain !== false) {
    report = await enrichFindingsWithModel(report, {
      changedFiles: input.changedFiles,
      diff: input.diff,
    });
  }

  return report;
}

export { recommendationsFromReport };
