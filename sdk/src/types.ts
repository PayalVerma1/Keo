// All the shared data shapes used across the SDK

// Log level can only be one of these four strings
export type LogLevel = "info" | "warn" | "error" | "debug";

// What a log entry looks like when sent to the server
export interface LogPayload {
  level: LogLevel;
  message: string;
  serviceId: string;
}

// What a metrics snapshot looks like when sent to the server
export interface MetricPayload {
  cpu: number;       // CPU usage in percent (0–100)
  memory: number;    // Memory usage in percent (0–100)
  throughput: number; // Number of requests since last snapshot
  latency: number;   // Average request time in milliseconds
  errors: number;    // Number of failed requests since last snapshot
  serviceId: string;
}

// What a deployment event looks like when sent to the server
export interface DeploymentPayload {
  version: string;   // e.g. "v1.0.0" or a Git commit SHA
  serviceId: string;
}

// Options you pass when creating a Monitor instance
export interface MonitorConfig {
  apiKey: string;            // Your API key for authentication
  serviceId: string;         // Unique ID of this service
  baseUrl?: string;          // Where your Keo server is (default: localhost:3000)
  metricsInterval?: number;  // How often to auto-send metrics in ms (default: 30000)
  logBatchSize?: number;     // How many logs to collect before sending (default: 10)
  logFlushInterval?: number; // How long to wait before sending logs in ms (default: 5000)
  silent?: boolean;          // If true, suppresses all console output
}
