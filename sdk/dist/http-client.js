"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpClient = void 0;
// HttpClient handles all the communication with your Keo server.
// It automatically retries failed requests up to 3 times.
class HttpClient {
    constructor(config) {
        // Remove trailing slash from base URL so we don't end up with double slashes
        this.baseUrl = (config.baseUrl ?? "http://localhost:3000").replace(/\/$/, "");
        this.apiKey = config.apiKey;
        this.silent = config.silent ?? false;
    }
    async post(path, body, retries = 3) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                const response = await fetch(`${this.baseUrl}${path}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${this.apiKey}`,
                    },
                    body: JSON.stringify(body),
                });
                if (!response.ok) {
                    const text = await response.text().catch(() => "");
                    throw new Error(`HTTP ${response.status}: ${text}`);
                }
                return (await response.json());
            }
            catch (err) {
                if (attempt === retries)
                    throw err;
                const delay = Math.min(1000 * 2 ** attempt, 8000);
                this.log(`[keo-sdk] Retry ${attempt}/${retries} after ${delay}ms…`);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
        throw new Error("Unreachable");
    }
    log(msg) {
        if (!this.silent)
            console.log(msg);
    }
}
exports.HttpClient = HttpClient;
//# sourceMappingURL=http-client.js.map