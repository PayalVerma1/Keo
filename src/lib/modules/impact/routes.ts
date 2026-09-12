import type { RouteSnapshot } from "./types";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeRoute(method: string, rawUrl: string): { method: string; route: string } {
  const methodNorm = (method || "GET").toUpperCase();
  let path = (rawUrl || "/").split("?")[0] || "/";
  try {
    if (path.startsWith("http")) path = new URL(path).pathname;
  } catch {
    // Keep the raw path when URL parsing fails.
  }
  const parts = path.split("/").map((seg) => {
    if (!seg) return seg;
    if (/^[0-9]+$/.test(seg)) return ":id";
    if (UUID.test(seg)) return ":id";
    if (/^[0-9a-f]{24}$/i.test(seg)) return ":id";
    return seg;
  });
  const route = parts.join("/") || "/";
  return { method: methodNorm, route: route.startsWith("/") ? route : `/${route}` };
}

export function routeKey(method: string, route: string) {
  return `${method} ${route}`;
}

export function percentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

export function parseRouteSnapshots(value: unknown): RouteSnapshot[] {
  if (!Array.isArray(value)) return [];
  const rows: RouteSnapshot[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    if (typeof row.method !== "string" || typeof row.route !== "string") continue;
    rows.push({
      method: row.method.toUpperCase(),
      route: row.route,
      count: Number(row.count) || 0,
      errors: Number(row.errors) || 0,
      latencyP50: Number(row.latencyP50) || 0,
      latencyP95: Number(row.latencyP95) || 0,
    });
  }
  return rows;
}

export function mergeRouteSnapshots(snapshots: RouteSnapshot[]): RouteSnapshot[] {
  const byKey = new Map<string, { count: number; errors: number; p50Weight: number; p95Weight: number }>();
  for (const snap of snapshots) {
    const key = routeKey(snap.method, snap.route);
    const prev = byKey.get(key) ?? { count: 0, errors: 0, p50Weight: 0, p95Weight: 0 };
    prev.count += snap.count;
    prev.errors += snap.errors;
    prev.p50Weight += snap.latencyP50 * Math.max(snap.count, 1);
    prev.p95Weight += snap.latencyP95 * Math.max(snap.count, 1);
    byKey.set(key, prev);
  }
  return [...byKey.entries()].map(([key, value]) => {
    const [method, ...routeParts] = key.split(" ");
    const weight = Math.max(value.count, 1);
    return {
      method,
      route: routeParts.join(" ") || "/",
      count: value.count,
      errors: value.errors,
      latencyP50: Math.round(value.p50Weight / weight),
      latencyP95: Math.round(value.p95Weight / weight),
    };
  });
}

export function hintFile(route: string | null, files: string[]): string | null {
  if (!files.length) return null;
  if (!route) return files[0] ?? null;
  const tokens = route
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && token !== "api");
  let best: { file: string; score: number } | null = null;
  for (const file of files) {
    const lower = file.toLowerCase();
    let score = 0;
    for (const token of tokens) if (lower.includes(token)) score += 1;
    if (score && (!best || score > best.score)) best = { file, score };
  }
  return best?.file ?? null;
}
