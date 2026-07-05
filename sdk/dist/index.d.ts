import { LogCollector } from "./log-collector";
import { MetricsCollector } from "./metrics-collector";
import { DeploymentTracker } from "./deployment-tracker";
import { MonitorConfig } from "./types";
export * from "./types";
export declare class Monitor {
    readonly log: LogCollector;
    readonly metrics: MetricsCollector;
    readonly deployments: DeploymentTracker;
    private http;
    private config;
    constructor(config: MonitorConfig);
    start(): this;
    shutdown(): Promise<void>;
    middleware(): (req: {
        method: string;
        url: string;
    }, res: {
        statusCode: number;
        on: (event: string, cb: () => void) => void;
    }, next: () => void) => void;
    wrapHandler<TReq, TRes>(handler: (req: TReq) => Promise<TRes>): (req: TReq) => Promise<TRes>;
}
//# sourceMappingURL=index.d.ts.map