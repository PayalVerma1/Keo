"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { ErrorBanner } from "@/components/dashboard/error-banner";
import { useSocketState } from "@/lib/useSocketState";

type ServiceSummary = { id: string; name: string };

type RouteFingerprint = {
  method: string;
  route: string;
  count: number;
  errorRate: number;
  latencyP50: number;
  latencyP95: number;
};

type Fingerprint = {
  serviceId: string;
  capturedAt: string;
  windowDays: number;
  sampleSize: number;
  process: { cpu: number; memory: number; latency: number; errors: number } | null;
  routes: RouteFingerprint[];
};

export default function FingerprintHome() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [services, setServices] = useState<ServiceSummary[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [fingerprint, setFingerprint] = useState<Fingerprint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const socketState = useSocketState();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const load = useCallback(async (selected?: string) => {
    try {
      const listRes = await fetch("/api/services");
      if (listRes.status === 401) {
        router.replace("/login");
        return;
      }
      if (!listRes.ok) throw new Error("Failed to load applications");
      const list = (await listRes.json()) as ServiceSummary[];
      setServices(list);
      const nextId = selected && list.some((row) => row.id === selected) ? selected : list[0]?.id;
      if (!nextId) {
        setFingerprint(null);
        return;
      }
      setServiceId(nextId);
      const fpRes = await fetch(`/api/agent/fingerprint?serviceId=${encodeURIComponent(nextId)}`);
      if (!fpRes.ok) throw new Error("Failed to load production fingerprint");
      setFingerprint((await fpRes.json()) as Fingerprint);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load fingerprint");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    load();
  }, [status, load]);

  const handleLogout = () => signOut({ callbackUrl: "/login" });

  if (status === "loading" || status === "unauthenticated") return null;

  return (
    <div className="layout-wrapper">
      <Sidebar onLogout={handleLogout} userName={session?.user?.name ?? ""} socketState={socketState} />
      <main className="main-content">
        <Topbar userName={session?.user?.name ?? undefined} />
        <div className="dashboard-scroll-area">
          <div className="page-hero">
            <div className="page-title-wrap">
              <h1 className="page-title">Production fingerprint</h1>
              <p className="page-subtitle">
                The contract agents check before they ship. p95 and errors per route, from live traffic not a GitHub Action.
              </p>
            </div>
            {services.length > 0 && (
              <div className="page-actions">
                <select
                  className="min-h-10 rounded-md border border-[var(--border-color)] bg-[var(--bg-card)] px-3 text-sm"
                  value={serviceId}
                  onChange={(event) => {
                    setLoading(true);
                    setError("");
                    load(event.target.value);
                  }}
                >
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {error && (
            <ErrorBanner
              message={error}
              onRetry={() => {
                setError("");
                setLoading(true);
                load(serviceId);
              }}
            />
          )}

          {loading ? (
            <div className="card h-64 animate-pulse" />
          ) : !services.length ? (
            <div className="card px-5 py-10 text-center">
              <p className="mb-2 text-base font-semibold">No applications yet</p>
              <p className="mx-auto max-w-[440px] text-[13px] text-[var(--text-secondary)]">
                Register an app, install the SDK, and let production traffic build the fingerprint. Then connect the Keo MCP in Cursor.
              </p>
              <a
                href="/docs"
                className="mt-4 inline-flex min-h-10 items-center justify-center rounded-md bg-[var(--accent-green)] px-4 text-sm font-semibold text-[var(--on-accent)]"
              >
                Connect in Cursor
              </a>
            </div>
          ) : (
            <>
              <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <div className="card">
                  <div className="card-title">Window</div>
                  <div className="stat-value">{fingerprint?.windowDays ?? 14}d</div>
                </div>
                <div className="card">
                  <div className="card-title">Samples</div>
                  <div className="stat-value">{fingerprint?.sampleSize ?? 0}</div>
                </div>
                <div className="card">
                  <div className="card-title">Routes</div>
                  <div className="stat-value">{fingerprint?.routes.length ?? 0}</div>
                </div>
                <div className="card">
                  <div className="card-title">Prod p95</div>
                  <div className="stat-value">
                    {fingerprint?.process ? `${Math.round(fingerprint.process.latency)}ms` : "—"}
                  </div>
                </div>
              </div>

              <div className="card overflow-x-auto">
                <div className="card-title mb-3">Route contract</div>
                {!fingerprint?.routes.length ? (
                  <p className="text-sm text-[var(--text-secondary)]">
                    SDK is sending process metrics, but no per-route snapshots yet. Use `monitor.middleware()` so Keo can learn p95 by endpoint.
                  </p>
                ) : (
                  <table className="pr-score-table">
                    <thead>
                      <tr>
                        <th scope="col">Route</th>
                        <th scope="col">Requests</th>
                        <th scope="col">p50</th>
                        <th scope="col">p95</th>
                        <th scope="col">Error rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fingerprint.routes.map((route) => (
                        <tr key={`${route.method} ${route.route}`}>
                          <td className="font-mono text-sm">
                            {route.method} {route.route}
                          </td>
                          <td>{route.count}</td>
                          <td>{Math.round(route.latencyP50)}ms</td>
                          <td>{Math.round(route.latencyP95)}ms</td>
                          <td>{route.errorRate.toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
