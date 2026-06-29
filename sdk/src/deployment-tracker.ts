import { HttpClient } from "./http-client";
import { MonitorConfig } from "./types";

export class DeploymentTracker {
  private http: HttpClient;
  private serviceId: string;
  private silent: boolean;

  constructor(http: HttpClient, config: MonitorConfig) {
    this.http = http;
    this.serviceId = config.serviceId;
    this.silent = config.silent ?? false;
  }

  async track(version: string): Promise<void> {
    await this.http
      .post("/api/deployments", { version, serviceId: this.serviceId })
      .catch((err: unknown) => {
        if (!this.silent) console.error("[keo-sdk] Failed to track deployment:", err);
      });

    if (!this.silent) {
      console.log(`[keo-sdk] Deployment recorded: ${version}`);
    }
  }
}
