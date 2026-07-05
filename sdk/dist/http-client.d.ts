import { MonitorConfig } from "./types";
export declare class HttpClient {
    private baseUrl;
    private apiKey;
    private silent;
    constructor(config: MonitorConfig);
    post<T = unknown>(path: string, body: Record<string, unknown>, retries?: number): Promise<T>;
    private log;
}
//# sourceMappingURL=http-client.d.ts.map