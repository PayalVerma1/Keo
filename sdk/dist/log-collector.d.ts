import { HttpClient } from "./http-client";
import { MonitorConfig } from "./types";
export declare class LogCollector {
    private http;
    private serviceId;
    private batchSize;
    private flushInterval;
    private silent;
    private buffer;
    private timer;
    constructor(http: HttpClient, config: MonitorConfig);
    info(message: string): void;
    warn(message: string): void;
    debug(message: string): void;
    error(message: string | Error): void;
    flush(): Promise<void>;
    destroy(): void;
    private push;
    private scheduleFlush;
}
//# sourceMappingURL=log-collector.d.ts.map