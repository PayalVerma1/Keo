import { HttpClient } from "./http-client";
import { LogCollector } from "./log-collector";
import { MetricsCollector } from "./metrics-collector";
import { DeploymentTracker } from "./deployment-tracker";
import { MonitorConfig } from "./types";

export * from "./types";

/**
 * Monitor — the main entry point for the @keo/monitor-sdk.
 *
 * @example
 * ```ts
 * import { Monitor } from "@keo/monitor-sdk";
 *
 * const monitor = new Monitor({
 *   apiKey:    "your-jwt-api-key",
 *   serviceId: "your-service-id",
 *   baseUrl:   "https://your-keo-instance.com",
 * });
 *
 * // Logs
 * monitor.log.info("Server started");
 * monitor.log.error(new Error("Oops"));
 *
 * // Manual metrics
 * await monitor.metrics.send({ cpu: 42, memory: 60, throughput: 120, latency: 85, errors: 2 });
 *
 * // Auto-metrics (Node.js) — starts background timer
 * monitor.start();
 *
 * // Deployments
 * await monitor.deployments.track("v1.0.0");
 *
 * // Middleware helper (Express / Node http)
 * app.use(monitor.middleware());
 *
 * // Graceful shutdown
 * await monitor.shutdown();
 * ```
 */
export class Monitor {
  /** Structured log collector (info / warn / error / debug) */
  readonly log: LogCollector;

  /** Metrics sender + request instrumentation */
  readonly metrics: MetricsCollector;

  /** Deployment event tracker */
  readonly deployments: DeploymentTracker;

  private readonly http: HttpClient;
  private readonly config: MonitorConfig;

  constructor(config: MonitorConfig) {
    this.config = config;
    this.http = new HttpClient(config);
    this.log = new LogCollector(this.http, config);
    this.metrics = new MetricsCollector(this.http, config);
    this.deployments = new DeploymentTracker(this.http, config);
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  /**
   * Start background metric collection.
   * No-op if `metricsInterval` is 0 or not set.
   */
  start(): this {
    this.metrics.start();
    return this;
  }

  /**
   * Flush pending logs and stop all background timers.
   * Always call this on process exit.
   *
   * @example
   * process.on("SIGTERM", () => monitor.shutdown().then(() => process.exit(0)));
   */
  async shutdown(): Promise<void> {
    this.metrics.stop();
    this.log.destroy();
    await this.log.flush();
  }

  // ── Middleware ────────────────────────────────────────────────────────────

  /**
   * Returns an Express-compatible middleware that automatically:
   * - Measures request latency
   * - Counts requests and errors
   * - Logs errors
   *
   * @example
   * import express from "express";
   * const app = express();
   * app.use(monitor.middleware());
   */
  middleware() {
    return (
      req: { method: string; url: string },
      res: { statusCode: number; on: (event: string, cb: () => void) => void },
      next: () => void
    ) => {
      const end = this.metrics.startRequest();

      res.on("finish", () => {
        const isError = res.statusCode >= 500;
        end({ error: isError });

        if (isError) {
          this.log.error(`${req.method} ${req.url} → ${res.statusCode}`);
        }
      });

      next();
    };
  }

  /**
   * Returns a Next.js-compatible wrapper for API route handlers that
   * instruments latency and error tracking automatically.
   *
   * @example
   * // pages/api/hello.ts  OR  app/api/hello/route.ts
   * export const GET = monitor.wrapHandler(async (req) => {
   *   return new Response("Hello");
   * });
   */
  wrapHandler<TReq, TRes>(
    handler: (req: TReq) => Promise<TRes>
  ): (req: TReq) => Promise<TRes> {
    return async (req: TReq): Promise<TRes> => {
      const end = this.metrics.startRequest();
      try {
        const result = await handler(req);
        end();
        return result;
      } catch (err) {
        end({ error: true });
        this.log.error(err instanceof Error ? err : new Error(String(err)));
        throw err;
      }
    };
  }
}
