import { HttpClient } from "./http-client";
import { MetricPayload, MonitorConfig } from "./types";

/**
 * MetricsCollector
 *
 * Sends metrics snapshots to POST /api/metrics.
 * When `metricsInterval > 0` and the runtime exposes `process.cpuUsage` /
 * `process.memoryUsage`, it also auto-collects system metrics periodically.
 */
export class MetricsCollector {
  private readonly http: HttpClient;
  private readonly serviceId: string;
  private readonly interval: number;
  private readonly silent: boolean;

  // Rolling window counters for request tracking
  private requestCount = 0;
  private errorCount = 0;
  private latencySum = 0;
  private latencySamples = 0;

  private timer: ReturnType<typeof setInterval> | null = null;
  private lastCpuUsage: NodeJS.CpuUsage | null = null;

  constructor(http: HttpClient, config: MonitorConfig) {
    this.http = http;
    this.serviceId = config.serviceId;
    this.interval = config.metricsInterval ?? 30_000;
    this.silent = config.silent ?? false;
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────

  /**
   * Start periodic auto-collection (Node.js only).
   * Reads CPU, memory from the OS and uses the rolling request counters.
   */
  start() {
    if (this.interval <= 0 || this.timer) return;

    if (typeof process !== "undefined" && process.cpuUsage) {
      this.lastCpuUsage = process.cpuUsage();
    }

    this.timer = setInterval(() => {
      const snapshot = this.collectSystemSnapshot();
      this.send(snapshot).catch(() => {});
    }, this.interval);

    // Don't block Node.js exit
    if (this.timer.unref) this.timer.unref();

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

  // ── Manual API ───────────────────────────────────────────────────────────

  /**
   * Manually send a complete metrics snapshot.
   * Use when you prefer full control over what is reported.
   */
  async send(payload: Omit<MetricPayload, "serviceId">): Promise<void> {
    await this.http
      .post("/api/metrics", { ...payload, serviceId: this.serviceId })
      .catch((err: unknown) => {
        if (!this.silent) console.error("[keo-sdk] Failed to send metric:", err);
      });
  }

  // ── Request Instrumentation ──────────────────────────────────────────────

  /**
   * Call this at the start of each request; returns a function you call at
   * the end to record latency and optional error.
   *
   * @example
   * const end = monitor.metrics.startRequest();
   * try {
   *   await handle(req, res);
   * } catch (err) {
   *   end({ error: true });
   *   throw err;
   * }
   * end();
   */
  startRequest(): (opts?: { error?: boolean }) => void {
    const t0 = Date.now();
    this.requestCount++;

    return (opts = {}) => {
      const latency = Date.now() - t0;
      this.latencySum += latency;
      this.latencySamples++;
      if (opts.error) this.errorCount++;
    };
  }

  // ── Private ──────────────────────────────────────────────────────────────

  private collectSystemSnapshot(): Omit<MetricPayload, "serviceId"> {
    const memory = this.getMemoryPercent();
    const cpu = this.getCpuPercent();
    const throughput = this.requestCount;
    const latency = this.latencySamples > 0
      ? Math.round(this.latencySum / this.latencySamples)
      : 0;
    const errors = this.errorCount;

    // Reset rolling counters after each flush
    this.requestCount = 0;
    this.errorCount = 0;
    this.latencySum = 0;
    this.latencySamples = 0;

    return { cpu, memory, throughput, latency, errors };
  }

  private getMemoryPercent(): number {
    if (typeof process !== "undefined" && process.memoryUsage) {
      const { heapUsed, heapTotal } = process.memoryUsage();
      return Math.round((heapUsed / heapTotal) * 100);
    }

    // Browser: estimate via performance.memory (non-standard, Chrome only)
    const perf = (globalThis as any).performance;
    if (perf?.memory) {
      return Math.round((perf.memory.usedJSHeapSize / perf.memory.totalJSHeapSize) * 100);
    }

    return 0;
  }

  private getCpuPercent(): number {
    if (typeof process === "undefined" || !process.cpuUsage) return 0;

    const now = process.cpuUsage(this.lastCpuUsage ?? undefined);
    this.lastCpuUsage = process.cpuUsage();

    // cpuUsage returns microseconds; convert to approximate % over the interval
    const totalMicros = (now.user + now.system);
    const intervalMicros = this.interval * 1_000;
    return Math.min(100, Math.round((totalMicros / intervalMicros) * 100));
  }
}
