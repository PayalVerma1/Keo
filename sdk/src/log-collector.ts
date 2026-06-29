import { HttpClient } from "./http-client";
import { LogLevel, LogPayload, MonitorConfig } from "./types";

// LogCollector batches up log messages and sends them to the server
// either when the batch is full, or after a short time delay.
export class LogCollector {
  private http: HttpClient;
  private serviceId: string;
  private batchSize: number;     // Send when this many logs are buffered
  private flushInterval: number; // Send after this many ms even if batch isn't full
  private silent: boolean;

  private buffer: LogPayload[] = []; // Logs waiting to be sent
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(http: HttpClient, config: MonitorConfig) {
    this.http = http;
    this.serviceId = config.serviceId;
    this.batchSize = config.logBatchSize ?? 10;
    this.flushInterval = config.logFlushInterval ?? 5_000;
    this.silent = config.silent ?? false;
  }

  // --- Public logging methods ---

  info(message: string)  { this.push("info",  message); }
  warn(message: string)  { this.push("warn",  message); }
  debug(message: string) { this.push("debug", message); }

  // Accepts either a string or an Error object
  error(message: string | Error) {
    this.push("error", message instanceof Error ? message.message : message);
  }
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    // Take everything out of the buffer and send each log
    const batch = this.buffer.splice(0);
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

  // Stops the auto-flush timer. Call this when shutting down.
  destroy() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  // Adds a log entry to the buffer, then flushes if the buffer is full
  private push(level: LogLevel, message: string) {
    this.buffer.push({ level, message, serviceId: this.serviceId });

    if (this.buffer.length >= this.batchSize) {
      // Buffer is full — send right away
      this.flush().catch(() => {});
    } else {
      // Not full yet — schedule a send for later
      this.scheduleFlush();
    }
  }

  // Sets a timer to flush after `flushInterval` ms.
  // If a timer is already running, we do nothing (to avoid sending twice).
  private scheduleFlush() {
    if (this.timer) return;

    this.timer = setTimeout(() => {
      this.timer = null;
      this.flush().catch(() => {});
    }, this.flushInterval);
  }
}
