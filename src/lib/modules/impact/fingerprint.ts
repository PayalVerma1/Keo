import { prisma } from "../../config/prisma";
import { mergeRouteSnapshots, parseRouteSnapshots, routeKey } from "./routes";
import type { ProcessFingerprint, RouteFingerprint, ServiceFingerprint } from "./types";

const PROCESS_KEYS = ["cpu", "memory", "latency", "errors"] as const;
const DEFAULT_WINDOW_DAYS = 14;

type MetricRow = {
  cpu: number;
  memory: number;
  latency: number;
  errors: number;
  routes: unknown;
};

const averageProcess = (rows: MetricRow[]): ProcessFingerprint | null => {
  if (!rows.length) return null;
  return {
    cpu: rows.reduce((sum, row) => sum + row.cpu, 0) / rows.length,
    memory: rows.reduce((sum, row) => sum + row.memory, 0) / rows.length,
    latency: rows.reduce((sum, row) => sum + row.latency, 0) / rows.length,
    errors: rows.reduce((sum, row) => sum + row.errors, 0) / rows.length,
  };
};

const routesFromRows = (rows: MetricRow[]): RouteFingerprint[] => {
  const merged = mergeRouteSnapshots(rows.flatMap((row) => parseRouteSnapshots(row.routes)));
  return merged
    .map((route) => ({
      method: route.method,
      route: route.route,
      count: route.count,
      errorRate: route.count > 0 ? (route.errors / route.count) * 100 : 0,
      latencyP50: route.latencyP50,
      latencyP95: route.latencyP95,
    }))
    .sort((a, b) => b.count - a.count);
};

export function observedFromMetricRows(rows: MetricRow[]): {
  process: ProcessFingerprint | null;
  routes: ReturnType<typeof mergeRouteSnapshots>;
} {
  return {
    process: averageProcess(rows),
    routes: mergeRouteSnapshots(rows.flatMap((row) => parseRouteSnapshots(row.routes))),
  };
}

export async function buildFingerprint(
  serviceId: string,
  options?: { before?: Date; windowDays?: number }
): Promise<ServiceFingerprint> {
  const windowDays = options?.windowDays ?? DEFAULT_WINDOW_DAYS;
  const before = options?.before ?? new Date();
  const since = new Date(before.getTime() - windowDays * 24 * 60 * 60 * 1000);

  const rows = await prisma.metrics.findMany({
    where: {
      serviceId,
      verificationJobId: null,
      createdAt: { gte: since, lt: before },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
    select: { cpu: true, memory: true, latency: true, errors: true, routes: true, createdAt: true },
  });

  const process = averageProcess(rows);
  const routes = routesFromRows(rows);

  return {
    serviceId,
    capturedAt: new Date().toISOString(),
    windowDays,
    sampleSize: rows.length,
    process,
    routes,
  };
}

export async function persistFingerprint(fingerprint: ServiceFingerprint) {
  if (!fingerprint.process) return;
  await prisma.verificationBaseline.create({
    data: {
      serviceId: fingerprint.serviceId,
      sampleSize: fingerprint.sampleSize,
      metrics: {
        ...fingerprint.process,
        routes: fingerprint.routes.map((route) => ({
          method: route.method,
          route: route.route,
          count: route.count,
          errorRate: route.errorRate,
          latencyP50: route.latencyP50,
          latencyP95: route.latencyP95,
          key: routeKey(route.method, route.route),
        })),
      },
    },
  });
}
