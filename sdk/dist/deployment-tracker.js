"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeploymentTracker = void 0;
class DeploymentTracker {
    constructor(http, config) {
        this.http = http;
        this.serviceId = config.serviceId;
        this.silent = config.silent ?? false;
    }
    async track(version) {
        await this.http
            .post("/api/deployments", { version, serviceId: this.serviceId })
            .catch((err) => {
            if (!this.silent)
                console.error("[keo-sdk] Failed to track deployment:", err);
        });
        if (!this.silent) {
            console.log(`[keo-sdk] Deployment recorded: ${version}`);
        }
    }
}
exports.DeploymentTracker = DeploymentTracker;
//# sourceMappingURL=deployment-tracker.js.map