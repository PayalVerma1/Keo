import { HttpClient } from "./http-client";
import { MetricPayload, MonitorConfig } from "./types";

export class MetricsCollector {
  private http: HttpClient;
  private serviceId: string;
  private interval: number;
  private silent: boolean;

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

  async send(payload: Omit<MetricPayload, "serviceId">): Promise<void> {
    await this.http
      .post("/api/metrics", { ...payload, serviceId: this.serviceId })
      .catch((err: unknown) => {
        if (!this.silent) console.error("[keo-sdk] Failed to send metric:", err);
      });
  }

  startRequest(): (opts?: { error?: boolean }) => void {
    const t0 = Date.now();
    this.requestCount++;

    return (opts = {}) => {
      this.latencySum += Date.now() - t0;
      this.latencySamples++;
      if (opts.error) this.errorCount++;
    };
  }

  private snapshot(): Omit<MetricPayload, "serviceId"> {
    const result = {
      cpu: this.cpuPercent(),
      memory: this.memoryPercent(),
      throughput: this.requestCount,
      latency: this.latencySamples > 0 ? Math.round(this.latencySum / this.latencySamples) : 0,
      errors: this.errorCount,
    };

    this.requestCount = this.errorCount = this.latencySum = this.latencySamples = 0;
    return result;
  }

  private memoryPercent(): number {
    if (typeof process !== "undefined" && process.memoryUsage) {
      const { heapUsed, heapTotal } = process.memoryUsage();
      return Math.round((heapUsed / heapTotal) * 100);
    }

    const perf = (globalThis as any).performance;
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
