import { MonitorConfig } from "./types";

/**
 * Thin HTTP client that wraps fetch with auth headers and base URL.
 * Automatically retries transient failures with exponential back-off.
 */
export class HttpClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly silent: boolean;

  constructor(config: MonitorConfig) {
    this.baseUrl = (config.baseUrl ?? "http://localhost:3000").replace(/\/$/, "");
    this.apiKey = config.apiKey;
    this.silent = config.silent ?? false;
  }

  // ── Public ──────────────────────────────────────────────────────────────

  async post<T = unknown>(
    path: string,
    body: Record<string, unknown>,
    retries = 3
  ): Promise<T> {
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

        return (await response.json()) as T;
      } catch (err) {
        if (attempt === retries) throw err;

        const delay = Math.min(1000 * 2 ** attempt, 8000); // exp back-off, cap 8s
        this.log(`[keo-sdk] Retry ${attempt}/${retries} after ${delay}ms…`);
        await this.sleep(delay);
      }
    }

    // Unreachable but satisfies TypeScript
    throw new Error("Unreachable");
  }

  // ── Private ─────────────────────────────────────────────────────────────

  private sleep(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }

  private log(msg: string) {
    if (!this.silent) console.log(msg);
  }
}
