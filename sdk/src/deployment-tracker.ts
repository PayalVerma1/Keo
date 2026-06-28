import { HttpClient } from "./http-client";
import { DeploymentPayload, MonitorConfig } from "./types";

/**
 * DeploymentTracker
 *
 * Reports deployment events to POST /api/deployments.
 * Call `track()` from your CI/CD pipeline or startup hook.
 */
export class DeploymentTracker {
  private readonly http: HttpClient;
  private readonly serviceId: string;
  private readonly silent: boolean;

  constructor(http: HttpClient, config: MonitorConfig) {
    this.http = http;
    this.serviceId = config.serviceId;
    this.silent = config.silent ?? false;
  }

  /**
   * Record a new deployment.
   *
   * @param version - Semantic version, Git SHA, or any identifier
   *
   * @example
   * await monitor.deployments.track("v2.4.1");
   * await monitor.deployments.track(process.env.GIT_SHA);
   */
  async track(version: string): Promise<void> {
    const payload: Omit<DeploymentPayload, "serviceId"> & { serviceId: string } = {
      version,
      serviceId: this.serviceId,
    };

    await this.http
      .post("/api/deployments", payload as unknown as Record<string, unknown>)
      .catch((err: unknown) => {
        if (!this.silent) {
          console.error("[keo-sdk] Failed to track deployment:", err);
        }
      });

    if (!this.silent) {
      console.log(`[keo-sdk] Deployment recorded: ${version}`);
    }
  }
}
