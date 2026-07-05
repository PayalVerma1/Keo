"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Monitor = void 0;
const http_client_1 = require("./http-client");
const log_collector_1 = require("./log-collector");
const metrics_collector_1 = require("./metrics-collector");
const deployment_tracker_1 = require("./deployment-tracker");
__exportStar(require("./types"), exports);
class Monitor {
    constructor(config) {
        this.config = config;
        this.http = new http_client_1.HttpClient(config);
        this.log = new log_collector_1.LogCollector(this.http, config);
        this.metrics = new metrics_collector_1.MetricsCollector(this.http, config);
        this.deployments = new deployment_tracker_1.DeploymentTracker(this.http, config);
    }
    start() {
        this.metrics.start();
        return this;
    }
    async shutdown() {
        this.metrics.stop();
        this.log.destroy();
        await this.log.flush();
    }
    middleware() {
        return (req, res, next) => {
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
    wrapHandler(handler) {
        return async (req) => {
            const end = this.metrics.startRequest();
            try {
                const result = await handler(req);
                end();
                return result;
            }
            catch (err) {
                end({ error: true });
                this.log.error(err instanceof Error ? err : new Error(String(err)));
                throw err;
            }
        };
    }
}
exports.Monitor = Monitor;
//# sourceMappingURL=index.js.map