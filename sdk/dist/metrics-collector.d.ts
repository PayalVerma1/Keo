import { HttpClient } from "./http-client";
import { MetricPayload, MonitorConfig } from "./types";
export declare class MetricsCollector {
    private http;
    private serviceId;
    private interval;
    private silent;
    private requestCount;
    private errorCount;
    private latencySum;
    private latencySamples;
    private timer;
    private lastCpuUsage;
    constructor(http: HttpClient, config: MonitorConfig);
    start(): void;
    stop(): void;
    send(payload: Omit<MetricPayload, "serviceId">): Promise<void>;
    startRequest(): (opts?: {
        error?: boolean;
    }) => void;
    private snapshot;
    private memoryPercent;
    private cpuPercent;
}
//# sourceMappingURL=metrics-collector.d.ts.map