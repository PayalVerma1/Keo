// ─── Types ─────────────────────────────────────────────────────────────────

export type LogLevel = "info" | "warn" | "error" | "debug";

export interface MetricPayload {
  /** CPU usage percentage (0–100) */
  cpu: number;
  /** Memory usage percentage (0–100) */
  memory: number;
  /** Request throughput (req/s) */
  throughput: number;
  /** Average response latency in milliseconds */
  latency: number;
  /** Error count in the current window */
  errors: number;
  /** Target service ID (injected automatically from SDK config) */
  serviceId: string;
}

export interface LogPayload {
  level: LogLevel;
  message: string;
  /** Target service ID (injected automatically from SDK config) */
  serviceId: string;
}

export interface DeploymentPayload {
  version: string;
  /** Target service ID (injected automatically from SDK config) */
  serviceId: string;
}

// ─── Config ────────────────────────────────────────────────────────────────

export interface MonitorConfig {
  /**
   * Your Keo API key (JWT token).
   * Generate one from the Keo dashboard → Settings → API Keys.
   */
  apiKey: string;

  /**
   * The service ID from your Keo dashboard.
   * Found under Services → [Your Service] → copy the ID.
   */
  serviceId: string;

  /**
   * Base URL of your Keo backend.
   * Defaults to http://localhost:3000
   */
  baseUrl?: string;

  /**
   * Auto-collect and send system metrics every N milliseconds.
   * Set to 0 or omit to disable.
   * @default 30000
   */
  metricsInterval?: number;

  /**
   * Number of log entries to buffer before flushing to the server.
   * @default 10
   */
  logBatchSize?: number;

  /**
   * Maximum time (ms) to wait before auto-flushing buffered logs.
   * @default 5000
   */
  logFlushInterval?: number;

  /**
   * Suppress all console output from the SDK itself.
   * @default false
   */
  silent?: boolean;
}
