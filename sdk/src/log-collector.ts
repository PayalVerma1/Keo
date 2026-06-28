import { HttpClient } from "./http-client";
import { LogLevel, LogPayload, MonitorConfig } from "./types";

/**
 * LogCollector
 *
 * Batches log entries and flushes them to POST /api/logs
 * either when the batch is full or after a configurable timeout.
 */
export class LogCollector {
  private readonly http: HttpClient;
  private readonly serviceId: string;
  private readonly batchSize: number;
  private readonly flushInterval: number;
  private readonly silent: boolean;

  private buffer: LogPayload[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(http: HttpClient, config: MonitorConfig) {
    this.http = http;
    this.serviceId = config.serviceId;
    this.batchSize = config.logBatchSize ?? 10;
    this.flushInterval = config.logFlushInterval ?? 5_000;
    this.silent = config.silent ?? false;
  }

  // ── Public API ───────────────────────────────────────────────────────────

  info(message: string) {
    this.push("info", message);
  }

  warn(message: string) {
    this.push("warn", message);
  }

  error(message: string | Error) {
    this.push("error", message instanceof Error ? message.message : message);
  }

  debug(message: string) {
    this.push("debug", message);
  }

  /**
   * Flush all buffered logs immediately.
   * Call this on process exit to avoid losing buffered data.
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const batch = this.buffer.splice(0);

    // Send each log individually (matches POST /api/logs signature)
    await Promise.all(
      batch.map((entry) =>
        this.http
          .post("/api/logs", entry as unknown as Record<string, unknown>)
          .catch((err: unknown) => {
            if (!this.silent) console.error("[keo-sdk] Failed to send log:", err);
          })
      )
    );
  }

  /** Stop the auto-flush timer (call on shutdown). */
  destroy() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  // ── Private ──────────────────────────────────────────────────────────────

  private push(level: LogLevel, message: string) {
    this.buffer.push({ level, message, serviceId: this.serviceId });

    if (this.buffer.length >= this.batchSize) {
      this.flush().catch(() => {});
    } else {
      this.scheduleFlush();
    }
  }

  private scheduleFlush() {
    if (this.timer) return; // already scheduled

    this.timer = setTimeout(() => {
      this.timer = null;
      this.flush().catch(() => {});
    }, this.flushInterval);
  }
}
