import { HttpClient } from "./http-client";
import { LogCollector } from "./log-collector";
import { MetricsCollector } from "./metrics-collector";
import { DeploymentTracker } from "./deployment-tracker";
import { MonitorConfig } from "./types";

export * from "./types";

export class Monitor {
  readonly log: LogCollector;           
  readonly metrics: MetricsCollector;   
  readonly deployments: DeploymentTracker; 
  private http: HttpClient;
  private config: MonitorConfig;

  constructor(config: MonitorConfig) {
    this.config = config;
    this.http = new HttpClient(config);
    this.log = new LogCollector(this.http, config);
    this.metrics = new MetricsCollector(this.http, config);
    this.deployments = new DeploymentTracker(this.http, config);
  }

  start(): this {
    this.metrics.start();
    return this;
  }

  async shutdown(): Promise<void> {
    this.metrics.stop();
    this.log.destroy();
    await this.log.flush();
  }

  middleware() {
    return (
      req: { method: string; url: string },
      res: { statusCode: number; on: (event: string, cb: () => void) => void },
      next: () => void
    ) => {
      const end = this.metrics.startRequest();

      // When the response finishes, record the result
      res.on("finish", () => {
        const isError = res.statusCode >= 500;
        end({ error: isError });

        if (isError) {
          this.log.error(`${req.method} ${req.url} → ${res.statusCode}`);
        }
      });

      next();
    };
  }

  wrapHandler<TReq, TRes>(handler: (req: TReq) => Promise<TRes>): (req: TReq) => Promise<TRes> {
    return async (req: TReq): Promise<TRes> => {
      const end = this.metrics.startRequest();
      try {
        const result = await handler(req);
        end();
        return result;
      } catch (err) {
        end({ error: true });
        this.log.error(err instanceof Error ? err : new Error(String(err)));
        throw err;
      }
    };
  }
}
