"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogCollector = void 0;
// LogCollector batches up log messages and sends them to the server
// either when the batch is full, or after a short time delay.
class LogCollector {
    constructor(http, config) {
        this.buffer = []; // Logs waiting to be sent
        this.timer = null;
        this.http = http;
        this.serviceId = config.serviceId;
        this.batchSize = config.logBatchSize ?? 10;
        this.flushInterval = config.logFlushInterval ?? 5000;
        this.silent = config.silent ?? false;
    }
    // --- Public logging methods ---
    info(message) { this.push("info", message); }
    warn(message) { this.push("warn", message); }
    debug(message) { this.push("debug", message); }
    // Accepts either a string or an Error object
    error(message) {
        this.push("error", message instanceof Error ? message.message : message);
    }
    async flush() {
        if (this.buffer.length === 0)
            return;
        // Take everything out of the buffer and send each log
        const batch = this.buffer.splice(0);
        await Promise.all(batch.map((entry) => this.http
            .post("/api/logs", entry)
            .catch((err) => {
            if (!this.silent)
                console.error("[keo-sdk] Failed to send log:", err);
        })));
    }
    // Stops the auto-flush timer. Call this when shutting down.
    destroy() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
    // Adds a log entry to the buffer, then flushes if the buffer is full
    push(level, message) {
        this.buffer.push({ level, message, serviceId: this.serviceId });
        if (this.buffer.length >= this.batchSize) {
            // Buffer is full — send right away
            this.flush().catch(() => { });
        }
        else {
            // Not full yet — schedule a send for later
            this.scheduleFlush();
        }
    }
    // Sets a timer to flush after `flushInterval` ms.
    // If a timer is already running, we do nothing (to avoid sending twice).
    scheduleFlush() {
        if (this.timer)
            return;
        this.timer = setTimeout(() => {
            this.timer = null;
            this.flush().catch(() => { });
        }, this.flushInterval);
    }
}
exports.LogCollector = LogCollector;
//# sourceMappingURL=log-collector.js.map