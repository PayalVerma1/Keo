import { HttpClient } from "./http-client";
import { MetricPayload, MonitorConfig, RouteSnapshot } from "./types";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MAX_ROUTES = 50;

export function normalizeRoute(method: string, rawUrl: string): { method: string; route: string } {
  const methodNorm = (method || "GET").toUpperCase();
  let path = (rawUrl || "/").split("?")[0] || "/";
  try {
    if (path.startsWith("http")) path = new URL(path).pathname;
  } catch {
    // Keep the raw path when URL parsing fails.
  }
  const parts = path.split("/").map((seg) => {
    if (!seg) return seg;
    if (/^[0-9]+$/.test(seg)) return ":id";
    if (UUID.test(seg)) return ":id";
    if (/^[0-9a-f]{24}$/i.test(seg)) return ":id";
    return seg;
  });
  const route = parts.join("/") || "/";
  return { method: methodNorm, route: route.startsWith("/") ? route : `/${route}` };
}

type RouteBucket = { count: number; errors: number; latencies: number[] };

function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

export class MetricsCollector {
  private http: HttpClient;
  private serviceId: string;
  private interval: number;
  private silent: boolean;
  private verificationJobId?: string;

  private requestCount = 0;
  private errorCount = 0;
  private latencySum = 0;
  private latencySamples = 0;
  private routes = new Map<string, RouteBucket>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private lastCpuUsage: NodeJS.CpuUsage | null = null;

  constructor(http: HttpClient, config: MonitorConfig) {
    this.http = http;
    this.serviceId = config.serviceId;
    this.interval = config.metricsInterval ?? 30_000;
    this.silent = config.silent ?? false;
    this.verificationJobId = config.verificationJobId ?? process.env.KEO_VERIFICATION_JOB_ID;
  }

  start() {
    if (this.interval <= 0 || this.timer) return;

    if (typeof process !== "undefined" && process.cpuUsage) {
      this.lastCpuUsage = process.cpuUsage();
    }

    this.timer = setInterval(() => this.send(this.snapshot()).catch(() => {}), this.interval);
    this.timer.unref?.();

    if (!this.silent) {
      console.log(`[keo-sdk] Auto-metrics every ${this.interval}ms for service ${this.serviceId}`);
    }
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Current interval snapshot without resetting counters. Useful for MCP observed payloads. */
  peek(): Omit<MetricPayload, "serviceId"> {
    return this.buildSnapshot(false);
  }

  async send(payload: Omit<MetricPayload, "serviceId">): Promise<void> {
    const verification = this.verificationJobId ? { verificationJobId: this.verificationJobId } : {};
    await this.http
      .post("/api/metrics", { ...payload, serviceId: this.serviceId, ...verification })
      .catch((err: unknown) => {
        if (!this.silent) console.error("[keo-sdk] Failed to send metric:", err);
      });
  }

  startRequest(meta?: { method?: string; path?: string }): (opts?: { error?: boolean }) => void {
    const t0 = Date.now();
    this.requestCount++;
    const routeMeta = meta?.method && meta?.path ? normalizeRoute(meta.method, meta.path) : null;

    return (opts = {}) => {
      const latency = Date.now() - t0;
      this.latencySum += latency;
      this.latencySamples++;
      if (opts.error) this.errorCount++;
      if (routeMeta) this.recordRoute(routeMeta.method, routeMeta.route, latency, Boolean(opts.error));
    };
  }

  private recordRoute(method: string, route: string, latency: number, error: boolean) {
    const key = `${method} ${route}`;
    const bucket = this.routes.get(key) ?? { count: 0, errors: 0, latencies: [] };
    bucket.count += 1;
    if (error) bucket.errors += 1;
    bucket.latencies.push(latency);
    this.routes.set(key, bucket);
  }

  private snapshot(): Omit<MetricPayload, "serviceId"> {
    return this.buildSnapshot(true);
  }

  private buildSnapshot(reset: boolean): Omit<MetricPayload, "serviceId"> {
    const routeRows: RouteSnapshot[] = [...this.routes.entries()]
      .map(([key, bucket]) => {
        const [method, ...routeParts] = key.split(" ");
        return {
          method,
          route: routeParts.join(" ") || "/",
          count: bucket.count,
          errors: bucket.errors,
          latencyP50: Math.round(percentile(bucket.latencies, 50)),
          latencyP95: Math.round(percentile(bucket.latencies, 95)),
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, MAX_ROUTES);

    const result = {
      cpu: this.cpuPercent(),
      memory: this.memoryPercent(),
      throughput: this.requestCount,
      latency: this.latencySamples > 0 ? Math.round(this.latencySum / this.latencySamples) : 0,
      errors: this.errorCount,
      routes: routeRows,
    };

    if (reset) {
      this.requestCount = this.errorCount = this.latencySum = this.latencySamples = 0;
      this.routes.clear();
    }
    return result;
  }

  private memoryPercent(): number {
    if (typeof process !== "undefined" && process.memoryUsage) {
      const { heapUsed, heapTotal } = process.memoryUsage();
      return Math.round((heapUsed / heapTotal) * 100);
    }

    const perf = (globalThis as { performance?: { memory?: { usedJSHeapSize: number; totalJSHeapSize: number } } })
      .performance;
    if (perf?.memory) {
      return Math.round((perf.memory.usedJSHeapSize / perf.memory.totalJSHeapSize) * 100);
    }

    return 0;
  }

  private cpuPercent(): number {
    if (typeof process === "undefined" || !process.cpuUsage) return 0;

    const delta = process.cpuUsage(this.lastCpuUsage ?? undefined);
    this.lastCpuUsage = process.cpuUsage();

    return Math.min(100, Math.round(((delta.user + delta.system) / (this.interval * 1_000)) * 100));
  }
}
