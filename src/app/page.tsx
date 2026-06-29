"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Layers, Activity, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { ServiceMetricCards } from "@/components/dashboard/metric-card";
import { ErrorBanner } from "@/components/dashboard/error-banner";
import { EmptyMetricsState } from "@/components/dashboard/empty-state";
import { ChartCard, ChartSkeleton } from "@/components/dashboard/chart-card";
import { InsightsPanel } from "@/components/dashboard/insight-card";
import { LiveStream } from "@/components/dashboard/live-stream";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChartPoint { time: string; value: number }
interface DashboardData {
  cpu: ChartPoint[];
  memory: ChartPoint[];
  latency: ChartPoint[];
  errors: ChartPoint[];
  summary: {
    totalServices: number;
    activeAlerts: number;
    avgLatency: string;
    errorRate: string;
  };
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  // ── Auth guard + initial fetch ──────────────────────────────────────────────
  const fetchDashboard = useCallback(async (token: string) => {
    try {
      const res = await fetch("/api/dashboard/metrics", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        // Token expired or invalid
        localStorage.removeItem("obs_token");
        localStorage.removeItem("obs_user");
        router.replace("/login");
        return;
      }

      if (!res.ok) throw new Error("Failed to load dashboard data");
      const json: DashboardData = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    setMounted(true);

    const token = localStorage.getItem("obs_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    const storedUser = localStorage.getItem("obs_user");
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch {}
    }

    fetchDashboard(token);

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      const t = localStorage.getItem("obs_token");
      if (t) fetchDashboard(t);
    }, 30_000);

    return () => clearInterval(interval);
  }, [router, fetchDashboard]);

  const handleLogout = () => {
    localStorage.removeItem("obs_token");
    localStorage.removeItem("obs_user");
    router.replace("/login");
  };

  if (!mounted) return null;

  return (
    <div className="layout-wrapper">
      <Sidebar onLogout={handleLogout} userName={user?.name ?? ""} />

      {/* Main Content Wrapper */}
      <main className="main-content">
        <Topbar userName={user?.name} />

        {/* Dashboard Area */}
        <div className="dashboard-scroll-area">
          {/* Error state */}
          {error && (
            <ErrorBanner
              message={error}
              onRetry={() => {
                setError("");
                setLoading(true);
                const token = localStorage.getItem("obs_token");
                if (token) fetchDashboard(token);
              }}
            />
          )}

          <div className="dashboard-grid">
            {/* Left Content Column */}
            <div>
              {/* Stats Row */}
              <ServiceMetricCards loading={loading} data={data} />

              {/* Charts Grid */}
              {!loading && data && data.cpu.length > 0 ? (
                <div className="charts-grid">
                  <ChartCard title="CPU USAGE (%)"  data={data.cpu}     color="#4B5563" />
                  <ChartCard title="MEMORY (GB)"    data={data.memory}  color="#10B981" opacity={0.7} />
                  <ChartCard title="LATENCY (MS)"   data={data.latency} color="#B45309" opacity={0.8} />
                  <ChartCard title="ERROR RATE (%)" data={data.errors}  color="#EF4444" opacity={0.6} />
                </div>
              ) : loading ? (
                <div className="charts-grid">
                  <ChartSkeleton />
                  <ChartSkeleton />
                  <ChartSkeleton />
                  <ChartSkeleton />
                </div>
              ) : (
                <EmptyMetricsState />
              )}

              {/* Infrastructure Status (static – from real service list) */}
              {data && data.summary.totalServices > 0 && (
                <div className="card">
                  <div className="card-header">
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Layers size={18} color="var(--text-secondary)" />
                      <span style={{ fontSize: "16px", fontWeight: 600 }}>
                        Regional Infrastructure Status
                      </span>
                    </div>
                    <div className="legend">
                      <div className="legend-item">
                        <div className="status-dot" /> Operational
                      </div>
                      <div className="legend-item">
                        <div className="status-dot" style={{ backgroundColor: "var(--accent-yellow)", boxShadow: "none" }} /> Degraded
                      </div>
                      <div className="legend-item">
                        <div className="status-dot" style={{ backgroundColor: "var(--accent-red)", boxShadow: "none" }} /> Outage
                      </div>
                    </div>
                  </div>
                  <div className="infra-grid">
                    {[
                      { name: "us-east-1",     load: 12.4, status: "normal" },
                      { name: "us-west-2",     load: 4.2,  status: "normal" },
                      { name: "eu-central-1",  load: 95.8, status: "critical" },
                      { name: "ap-northeast-1",load: 2.1,  status: "normal" },
                      { name: "sa-east-1",     load: 8.9,  status: "normal" },
                      { name: "af-south-1",    load: 1.2,  status: "normal" },
                    ].map((region) => (
                      <div className="region-card" key={region.name}>
                        <div className="region-header">
                          <span className="region-name">{region.name}</span>
                          {region.status === "normal" ? (
                            <CheckCircle2 size={14} color="var(--accent-green)" />
                          ) : (
                            <AlertTriangle size={14} color="var(--accent-yellow)" />
                          )}
                        </div>
                        <div className="load-bar-bg">
                          <div
                            className={`load-bar-fill ${region.status}`}
                            style={{ width: `${region.load}%` }}
                          />
                        </div>
                        <div className="region-load">Load: {region.load.toFixed(1)}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar Column */}
            <div className="right-sidebar">
              {/* AI Insights */}
              <InsightsPanel />

              {/* Live Stream */}
              <LiveStream />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
