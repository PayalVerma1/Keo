import { HttpClient } from "./http-client";
import { MonitorConfig } from "./types";
export declare class DeploymentTracker {
    private http;
    private serviceId;
    private silent;
    constructor(http: HttpClient, config: MonitorConfig);
    track(version: string): Promise<void>;
}
//# sourceMappingURL=deployment-tracker.d.ts.map