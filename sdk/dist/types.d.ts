export type LogLevel = "info" | "warn" | "error" | "debug";
export interface LogPayload {
    level: LogLevel;
    message: string;
    serviceId: string;
}
export interface MetricPayload {
    cpu: number;
    memory: number;
    throughput: number;
    latency: number;
    errors: number;
    serviceId: string;
}
export interface DeploymentPayload {
    version: string;
    serviceId: string;
}
export interface MonitorConfig {
    apiKey: string;
    serviceId: string;
    baseUrl?: string;
    metricsInterval?: number;
    logBatchSize?: number;
    logFlushInterval?: number;
    silent?: boolean;
}
//# sourceMappingURL=types.d.ts.map