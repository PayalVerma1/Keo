"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsCollector = void 0;
class MetricsCollector {
    constructor(http, config) {
        this.requestCount = 0;
        this.errorCount = 0;
        this.latencySum = 0;
        this.latencySamples = 0;
        this.timer = null;
        this.lastCpuUsage = null;
        this.http = http;
        this.serviceId = config.serviceId;
        this.interval = config.metricsInterval ?? 30000;
        this.silent = config.silent ?? false;
    }
    start() {
        if (this.interval <= 0 || this.timer)
            return;
        if (typeof process !== "undefined" && process.cpuUsage) {
            this.lastCpuUsage = process.cpuUsage();
        }
        this.timer = setInterval(() => this.send(this.snapshot()).catch(() => { }), this.interval);
        this.timer.unref?.();
        if (!this.silent) {
            console.log(`[keo-sdk] Auto-metrics every ${this.interval}ms for service ${this.serviceId}`);
        }
    }
    stop() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    async send(payload) {
        await this.http
            .post("/api/metrics", { ...payload, serviceId: this.serviceId })
            .catch((err) => {
            if (!this.silent)
                console.error("[keo-sdk] Failed to send metric:", err);
        });
    }
    startRequest() {
        const t0 = Date.now();
        this.requestCount++;
        return (opts = {}) => {
            this.latencySum += Date.now() - t0;
            this.latencySamples++;
            if (opts.error)
                this.errorCount++;
        };
    }
    snapshot() {
        const result = {
            cpu: this.cpuPercent(),
            memory: this.memoryPercent(),
            throughput: this.requestCount,
            latency: this.latencySamples > 0 ? Math.round(this.latencySum / this.latencySamples) : 0,
            errors: this.errorCount,
        };
        this.requestCount = this.errorCount = this.latencySum = this.latencySamples = 0;
        return result;
    }
    memoryPercent() {
        if (typeof process !== "undefined" && process.memoryUsage) {
            const { heapUsed, heapTotal } = process.memoryUsage();
            return Math.round((heapUsed / heapTotal) * 100);
        }
        const perf = globalThis.performance;
        if (perf?.memory) {
            return Math.round((perf.memory.usedJSHeapSize / perf.memory.totalJSHeapSize) * 100);
        }
        return 0;
    }
    cpuPercent() {
        if (typeof process === "undefined" || !process.cpuUsage)
            return 0;
        const delta = process.cpuUsage(this.lastCpuUsage ?? undefined);
        this.lastCpuUsage = process.cpuUsage();
        return Math.min(100, Math.round(((delta.user + delta.system) / (this.interval * 1000)) * 100));
    }
}
exports.MetricsCollector = MetricsCollector;
//# sourceMappingURL=metrics-collector.js.map