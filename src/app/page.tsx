"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  Clock,
  Layers,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { AppShell, AppTopbar } from "@/components/dashboard/app-shell";
import { ErrorBanner } from "@/components/dashboard/cards";
import { ChartSkeleton, MetricBarCard } from "@/components/dashboard/charts";
import type { ChartPoint, Insight, LogEntry, Service } from "@/components/dashboard/types";
import { relativeTime, severityBadge } from "@/components/dashboard/utils";

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

export default function Dashboard() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [liveLogs, setLiveLogs] = useState<LogEntry[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const logout = useCallback(() => {
    localStorage.removeItem("obs_token");
    localStorage.removeItem("obs_user");
    router.replace("/login");
  }, [router]);

  const fetchDashboard = useCallback(async (token: string) => {
    try {
      const response = await fetch("/api/dashboard/metrics", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        logout();
        return;
      }
      if (!response.ok) throw new Error("Failed to load dashboard data");
      setData(await response.json());
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [logout]);

  const fetchSidebarData = useCallback(async (token: string) => {
    try {
      const serviceResponse = await fetch("/api/services", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!serviceResponse.ok) return;
      const nextServices = (await serviceResponse.json()) as Service[];
      setServices(nextServices);
      if (nextServices.length === 0) return;

      const [allInsights, allLogs] = await Promise.all([
        Promise.all(nextServices.map((service) =>
          fetch(`/api/insights/${service.id}`, { headers: { Authorization: `Bearer ${token}` } })
            .then((response) => response.ok ? response.json() : [])
            .catch(() => [])
        )),
        Promise.all(nextServices.map((service) =>
          fetch(`/api/logs/${service.id}`, { headers: { Authorization: `Bearer ${token}` } })
            .then((response) => response.ok ? response.json() : [])
            .catch(() => [])
        )),
      ]);

      setInsights((allInsights.flat() as Insight[])
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5));

      setLiveLogs((allLogs.flat() as LogEntry[])
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 30));
    } catch {
      // Sidebar data is secondary. The main dashboard can still render.
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("obs_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    const storedUser = localStorage.getItem("obs_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {}
    }

    void fetchDashboard(token);
    void fetchSidebarData(token);

    const dashboardInterval = setInterval(() => {
      const nextToken = localStorage.getItem("obs_token");
      if (nextToken) void fetchDashboard(nextToken);
    }, 30_000);

    const sidebarInterval = setInterval(() => {
      const nextToken = localStorage.getItem("obs_token");
      if (nextToken) void fetchSidebarData(nextToken);
    }, 10_000);

    return () => {
      clearInterval(dashboardInterval);
      clearInterval(sidebarInterval);
    };
  }, [fetchDashboard, fetchSidebarData, router]);

  if (!mounted) return null;

  return (
    <AppShell active="/" userName={user?.name ?? ""} onLogout={logout}>
      <AppTopbar
        placeholder="Search telemetry..."
        liveText="Live - auto-refresh 30s"
        userInitial={user?.name?.[0]?.toUpperCase() ?? "U"}
      />

      <div className="dashboard-scroll-area">
        {error && (
          <ErrorBanner
            message={error}
            onRetry={() => {
              setError("");
              setLoading(true);
              const token = localStorage.getItem("obs_token");
              if (token) void fetchDashboard(token);
            }}
          />
        )}

        <div className="dashboard-grid">
          <div>
            <div className="stats-row">
              <OverviewStat title="Total Services" icon={<Layers size={16} color="var(--text-secondary)" />} loading={loading} value={data?.summary.totalServices ?? 0} hint={<><TrendingUp size={14} /> All services</>} />
              <OverviewStat title="Active Alerts" icon={<AlertTriangle size={16} color="var(--accent-red)" />} loading={loading} value={data?.summary.activeAlerts ?? 0} valueColor="var(--accent-red)" hint="High CPU or error rate" />
              <OverviewStat title="Avg Latency" icon={<Clock size={16} color="var(--text-secondary)" />} loading={loading} value={data?.summary.avgLatency ?? "-"} hint={<><Activity size={14} /> Across all services</>} />
              <OverviewStat title="Error Rate" icon={<Activity size={16} color="var(--accent-green)" />} loading={loading} value={data?.summary.errorRate ?? "-"} hint="Average across services" />
            </div>

            {!loading && data && data.cpu.length > 0 ? (
              <div className="charts-grid">
                <MetricBarCard title="CPU Usage (%)" data={data.cpu} color="#4B5563" />
                <MetricBarCard title="Memory (GB)" data={data.memory} color="#10B981" opacity={0.7} />
                <MetricBarCard title="Latency (ms)" data={data.latency} color="#B45309" opacity={0.8} />
                <MetricBarCard title="Error Rate (%)" data={data.errors} color="#EF4444" opacity={0.6} />
              </div>
            ) : loading ? (
              <div className="charts-grid">
                <ChartSkeleton />
                <ChartSkeleton />
                <ChartSkeleton />
                <ChartSkeleton />
              </div>
            ) : (
              <div className="card" style={{ marginBottom: 24, padding: "40px 20px", textAlign: "center", alignItems: "center" }}>
                <Activity size={48} color="var(--text-muted)" style={{ marginBottom: 16 }} />
                <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No metrics data yet</p>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", maxWidth: 420 }}>
                  Create a service, open it, and generate test telemetry to see the Redis Streams pipeline draw these charts.
                </p>
              </div>
            )}

            {data && data.summary.totalServices > 0 && <InfrastructureStatus />}
          </div>

          <div className="right-sidebar">
            <AiInsightsCard insights={insights} services={services} />
            <LiveLogsCard logs={liveLogs} services={services} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function OverviewStat({
  title,
  value,
  icon,
  hint,
  loading,
  valueColor,
}: {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  hint: React.ReactNode;
  loading: boolean;
  valueColor?: string;
}) {
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">{title}</span>
        {icon}
      </div>
      <div className="stat-value" style={{ color: valueColor }}>
        {loading ? <Loader2 size={20} className="spin" /> : value}
      </div>
      <div className="stat-trend" style={{ color: "var(--text-secondary)" }}>{hint}</div>
    </div>
  );
}

function InfrastructureStatus() {
  const regions = [
    { name: "us-east-1", load: 12.4, status: "normal" },
    { name: "us-west-2", load: 4.2, status: "normal" },
    { name: "eu-central-1", load: 95.8, status: "critical" },
    { name: "ap-northeast-1", load: 2.1, status: "normal" },
    { name: "sa-east-1", load: 8.9, status: "normal" },
    { name: "af-south-1", load: 1.2, status: "normal" },
  ];

  return (
    <div className="card">
      <div className="card-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Layers size={18} color="var(--text-secondary)" />
          <span style={{ fontSize: 16, fontWeight: 600 }}>Regional Infrastructure Status</span>
        </div>
        <div className="legend">
          <div className="legend-item"><div className="status-dot" /> Operational</div>
          <div className="legend-item"><div className="status-dot" style={{ backgroundColor: "var(--accent-yellow)", boxShadow: "none" }} /> Degraded</div>
          <div className="legend-item"><div className="status-dot" style={{ backgroundColor: "var(--accent-red)", boxShadow: "none" }} /> Outage</div>
        </div>
      </div>
      <div className="infra-grid">
        {regions.map((region) => (
          <div className="region-card" key={region.name}>
            <div className="region-header">
              <span className="region-name">{region.name}</span>
              {region.status === "normal" ? <CheckCircle2 size={14} color="var(--accent-green)" /> : <AlertTriangle size={14} color="var(--accent-yellow)" />}
            </div>
            <div className="load-bar-bg">
              <div className={`load-bar-fill ${region.status}`} style={{ width: `${region.load}%` }} />
            </div>
            <div className="region-load">Load: {region.load.toFixed(1)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AiInsightsCard({ insights, services }: { insights: Insight[]; services: Service[] }) {
  const router = useRouter();

  return (
    <div className="card" style={{ flex: 1 }}>
      <div className="card-header" style={{ marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <BrainCircuit size={18} color="#a5b4fc" />
          <span style={{ fontSize: 16, fontWeight: 600 }}>AI Insights</span>
        </div>
        <button className="btn-outline" style={{ fontSize: 11, padding: "3px 8px" }} onClick={() => router.push("/insights")} type="button">
          View all
        </button>
      </div>

      {insights.length === 0 ? (
        <div style={{ padding: "24px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 12 }}>
          <BrainCircuit size={28} color="var(--text-muted)" style={{ margin: "0 auto 8px" }} />
          No AI insights yet. Generate test telemetry from a service to trigger analysis.
        </div>
      ) : insights.map((insight) => {
        const config = severityBadge[insight.severity] ?? severityBadge.low;
        const serviceName = services.find((service) => service.id === insight.serviceId)?.name;
        return (
          <div key={insight.id} className="insight-item">
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ background: config.bg, color: config.text, padding: "2px 7px", borderRadius: 4, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>{insight.severity}</span>
              <span className="insight-time">{relativeTime(insight.createdAt)}</span>
              {serviceName && <span style={{ fontSize: 10, color: "var(--text-muted)", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: 4 }}>{serviceName}</span>}
            </div>
            <div className="insight-title" style={{ fontSize: 13, margin: "8px 0 4px" }}>{insight.rootCause?.slice(0, 80)}{insight.rootCause?.length > 80 ? "..." : ""}</div>
            <div className="insight-desc" style={{ fontSize: 11 }}>{insight.recommendation?.slice(0, 100)}{insight.recommendation?.length > 100 ? "..." : ""}</div>
            <button className="btn-outline" style={{ fontSize: 11, marginTop: 6 }} onClick={() => router.push(`/services/${insight.serviceId}`)} type="button">View Service</button>
          </div>
        );
      })}
    </div>
  );
}

function LiveLogsCard({ logs, services }: { logs: LogEntry[]; services: Service[] }) {
  const router = useRouter();

  return (
    <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div className="card-header">
        <span className="card-title">Live Stream</span>
        <div className="stat-trend trend-up" style={{ fontSize: 11 }}><div className="status-dot" /> LIVE</div>
      </div>
      <div className="terminal" id="live-stream-terminal">
        {logs.length === 0 ? (
          <div style={{ color: "var(--text-muted)", padding: "16px 0" }}>
            No logs yet. Generate service telemetry or send SDK logs.
          </div>
        ) : logs.slice(0, 20).map((log, index) => (
          <div key={log.id ?? index} style={{ marginBottom: 2 }}>
            <span className="term-time">{new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
            <span className={log.level === "error" ? "term-err" : log.level === "warn" ? "term-warn" : "term-info"}>[{log.level.toUpperCase()}]</span>
            {services.find((service) => service.id === log.serviceId)?.name && (
              <span style={{ color: "#a5b4fc", marginRight: 6, fontSize: 10 }}>
                [{services.find((service) => service.id === log.serviceId)?.name}]
              </span>
            )}
            <span style={{ color: "var(--text-secondary)" }}>{log.message}</span>
          </div>
        ))}
      </div>
      <button className="btn-outline" style={{ marginTop: 8, fontSize: 11, alignSelf: "flex-start" }} onClick={() => router.push("/logs")} type="button">
        Open full log viewer
      </button>
    </div>
  );
}
