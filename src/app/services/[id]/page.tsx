"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Bell,
  BrainCircuit,
  Cpu,
  FileText,
  HardDrive,
  LayoutGrid,
  Layers,
  Loader2,
  Play,
  Rocket,
  Search,
  Settings,
  Zap,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { io, Socket } from "socket.io-client";

interface Service {
  id: string;
  name: string;
  description?: string;
}

interface Metric {
  id?: string;
  cpu: number;
  memory: number;
  latency: number;
  errors: number;
  throughput: number;
  serviceId?: string;
  createdAt: string;
}

interface LogEntry {
  id?: string;
  level: string;
  message: string;
  serviceId?: string;
  createdAt: string;
}

interface Deployment {
  id?: string;
  version: string;
  serviceId?: string;
  createdAt: string;
}

interface Insight {
  id?: string;
  severity: string;
  rootCause?: string;
  recommendation?: string;
  reasons?: string[];
  detectedAt?: string;
  createdAt?: string;
}

const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

function Sidebar({ active }: { active: string }) {
  const router = useRouter();
  const navItems = [
    { label: "Overview", icon: <LayoutGrid size={18} />, href: "/" },
    { label: "Services", icon: <Layers size={18} />, href: "/services" },
    { label: "Logs", icon: <FileText size={18} />, href: "/logs" },
    { label: "Deployments", icon: <Rocket size={18} />, href: "/deployments" },
    { label: "AI Insights", icon: <BrainCircuit size={18} />, href: "/insights" },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">Obsidian Labs</div>
      <nav className="nav-menu">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={`nav-item${active === item.href ? " active" : ""}`}
            onClick={(event) => {
              event.preventDefault();
              router.push(item.href);
            }}
          >
            {item.icon} {item.label}
          </a>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="status-indicator">
          <div className="status-dot" />
          Connected
        </div>
        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "24px" }}>
          WebSocket: Live
        </div>
        <a href="#" className="nav-item" style={{ padding: 0 }}>
          <FileText size={18} /> Docs
        </a>
      </div>
    </aside>
  );
}

const authHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function ServiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const serviceId = params?.id as string;

  const [service, setService] = useState<Service | null>(null);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [socketState, setSocketState] = useState<"connecting" | "live" | "offline">("connecting");
  const [mounted, setMounted] = useState(false);

  const loadTelemetry = useCallback(async (token: string) => {
    const [servicesRes, metricsRes, logsRes, deploymentsRes, insightsRes] = await Promise.all([
      fetch("/api/services", { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`/api/services/${serviceId}/metrics`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`/api/logs/${serviceId}`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`/api/deployments/${serviceId}`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`/api/insights/${serviceId}`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);

    if (servicesRes.status === 401) {
      localStorage.removeItem("obs_token");
      router.replace("/login");
      return;
    }

    if (!servicesRes.ok || !metricsRes.ok || !logsRes.ok || !deploymentsRes.ok || !insightsRes.ok) {
      throw new Error("Could not load service telemetry.");
    }

    const services = (await servicesRes.json()) as Service[];
    setService(services.find((item) => item.id === serviceId) ?? null);
    setMetrics(await metricsRes.json());
    setLogs(await logsRes.json());
    setDeployments(await deploymentsRes.json());
    setInsights(await insightsRes.json());
  }, [router, serviceId]);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("obs_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    loadTelemetry(token)
      .catch((nextError) => setError(nextError instanceof Error ? nextError.message : "Telemetry load failed."))
      .finally(() => setLoading(false));
  }, [loadTelemetry, router]);

  useEffect(() => {
    if (!serviceId || !mounted) return;

    let socket: Socket | null = null;

    try {
      socket = io(socketUrl, { transports: ["websocket"] });
      socket.on("connect", () => {
        setSocketState("live");
        socket?.emit("service:join", serviceId);
      });
      socket.on("disconnect", () => setSocketState("offline"));
      socket.on("connect_error", () => setSocketState("offline"));
      socket.on("metric:created", (metric: Metric) => {
        setMetrics((current) => [...current, metric].slice(-80));
      });
      socket.on("log:created", (log: LogEntry) => {
        setLogs((current) => [log, ...current].slice(0, 80));
      });
      socket.on("deployment:created", (deployment: Deployment) => {
        setDeployments((current) => [deployment, ...current].slice(0, 20));
      });
      socket.on("anomaly:detected", (insight: Insight) => {
        setInsights((current) => [insight, ...current].slice(0, 20));
      });
    } catch {
      setSocketState("offline");
    }

    return () => {
      socket?.emit("service:left", serviceId);
      socket?.disconnect();
    };
  }, [mounted, serviceId]);

  const generateTelemetry = async () => {
    const token = localStorage.getItem("obs_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    setGenerating(true);
    setError("");
    setNotice("Queued telemetry events. Workers will save them, then charts refresh.");

    try {
      const version = `v${new Date().getHours()}.${new Date().getMinutes()}.${Math.floor(Math.random() * 100)}`;

      await fetch("/api/deployments", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ serviceId, version }),
      });

      const metricRequests = Array.from({ length: 12 }, (_, index) => {
        const isSpike = index > 8;
        const metric = {
          serviceId,
          cpu: Math.round((isSpike ? 86 + Math.random() * 12 : 35 + Math.random() * 42) * 10) / 10,
          memory: Math.round((isSpike ? 78 + Math.random() * 14 : 40 + Math.random() * 30) * 10) / 10,
          latency: Math.round(isSpike ? 850 + Math.random() * 550 : 110 + Math.random() * 260),
          throughput: Math.round(420 + Math.random() * 480),
          errors: Math.round((isSpike ? 7 + Math.random() * 9 : Math.random() * 3) * 10) / 10,
        };

        return fetch("/api/metrics", {
          method: "POST",
          headers: authHeaders(token),
          body: JSON.stringify(metric),
        });
      });

      const logRequests = [
        { level: "info", message: `Deployment ${version} received by deployment stream` },
        { level: "info", message: "Redis Stream consumer acknowledged metrics batch" },
        { level: "warn", message: "Latency crossed warning threshold for /api/checkout" },
        { level: "error", message: "Error spike detected after latest deployment" },
      ].map((log) =>
        fetch("/api/logs", {
          method: "POST",
          headers: authHeaders(token),
          body: JSON.stringify({ ...log, serviceId }),
        })
      );

      const responses = await Promise.all([...metricRequests, ...logRequests]);
      const failed = responses.find((response) => !response.ok);
      if (failed) throw new Error("Some telemetry events could not be queued.");

      await wait(1_500);
      await loadTelemetry(token);
      await wait(2_500);
      await loadTelemetry(token);
      setNotice("Telemetry saved. Charts are now generated from database metrics.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Could not generate telemetry.");
    } finally {
      setGenerating(false);
    }
  };

  const chartData = useMemo(() => metrics.slice(-30).map((metric) => ({
    time: new Date(metric.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    cpu: Number(metric.cpu.toFixed(1)),
    memory: Number(metric.memory.toFixed(1)),
    latency: Number(metric.latency.toFixed(0)),
    errors: Number(metric.errors.toFixed(1)),
    throughput: Number(metric.throughput.toFixed(0)),
  })), [metrics]);

  const latest = metrics.at(-1);
  const latestInsight = insights[0];

  if (!mounted) return null;

  return (
    <div className="layout-wrapper">
      <Sidebar active="/services" />
      <main className="main-content">
        <header className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button className="icon-btn" onClick={() => router.push("/services")} type="button" aria-label="Back to services">
              <ArrowLeft size={18} />
            </button>
            <div className="search-box">
              <Search size={16} color="var(--text-muted)" />
              <input type="text" placeholder="Search metrics..." />
            </div>
          </div>
          <div className="topbar-actions">
            <div className="live-badge">
              <div className="status-dot" />
              {socketState === "live" ? "Socket live" : socketState === "offline" ? "Socket offline" : "Connecting"}
            </div>
            <div className="icon-btn"><Bell size={18} /></div>
            <div className="icon-btn"><Settings size={18} /></div>
            <div className="avatar">
              <div style={{ width: "100%", height: "100%", background: "linear-gradient(45deg, #8b5cf6, #3b82f6)" }} />
            </div>
          </div>
        </header>

        <div className="dashboard-scroll-area">
          <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap" }}>
            <div>
              <h1 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "4px" }}>
                {service?.name ?? "Service monitor"}
              </h1>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                Metrics are generated by POST requests, queued in Redis Streams, saved by workers, then visualized here.
              </p>
            </div>
            <button
              className="form-submit"
              onClick={generateTelemetry}
              type="button"
              disabled={generating}
              style={{ width: "auto", minWidth: "220px", padding: "10px 18px", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
            >
              {generating ? <Loader2 size={16} className="spin" /> : <Play size={16} />}
              {generating ? "Generating telemetry" : "Generate test telemetry"}
            </button>
          </div>

          {notice && (
            <div className="card" style={{ marginBottom: "16px", borderColor: "var(--accent-green)", color: "var(--text-secondary)" }}>
              {notice}
            </div>
          )}

          {error && (
            <div className="form-error" style={{ marginBottom: "16px" }}>
              {error}
            </div>
          )}

          {loading ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "220px" }}>
              <Loader2 size={32} className="spin" color="var(--accent-green)" />
            </div>
          ) : (
            <>
              <div className="stats-row" style={{ marginBottom: "24px" }}>
                {[
                  { label: "CPU", value: `${latest?.cpu?.toFixed(1) ?? 0}%`, icon: <Cpu size={16} />, color: "var(--accent-blue)" },
                  { label: "MEMORY", value: `${latest?.memory?.toFixed(1) ?? 0}%`, icon: <HardDrive size={16} />, color: "var(--accent-green)" },
                  { label: "LATENCY", value: `${latest?.latency?.toFixed(0) ?? 0}ms`, icon: <Zap size={16} />, color: "var(--accent-yellow)" },
                  { label: "ERRORS", value: `${latest?.errors?.toFixed(1) ?? 0}`, icon: <AlertCircle size={16} />, color: "var(--accent-red)" },
                ].map((stat) => (
                  <div key={stat.label} className="card">
                    <div className="card-header">
                      <span className="card-title">{stat.label}</span>
                      <span style={{ color: stat.color }}>{stat.icon}</span>
                    </div>
                    <div className="stat-value" style={{ color: stat.color }}>{stat.value}</div>
                  </div>
                ))}
              </div>

              {metrics.length === 0 ? (
                <div className="card" style={{ textAlign: "center", padding: "56px 20px", marginBottom: "24px" }}>
                  <Activity size={48} color="var(--text-muted)" style={{ margin: "0 auto 16px" }} />
                  <p style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>No telemetry yet</p>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>
                    Click generate test telemetry to send metrics/logs/deployment events through Redis Streams.
                  </p>
                  <button className="form-submit" onClick={generateTelemetry} disabled={generating} type="button" style={{ width: "auto", margin: "0 auto", padding: "10px 18px" }}>
                    {generating ? "Queueing events" : "Generate now"}
                  </button>
                </div>
              ) : (
                <div className="charts-grid" style={{ marginBottom: "24px" }}>
                  <MetricLine title="CPU USAGE (%)" dataKey="cpu" color="#3b82f6" data={chartData} />
                  <MetricBar title="MEMORY (%)" dataKey="memory" color="#10B981" data={chartData} />
                  <MetricLine title="LATENCY (MS)" dataKey="latency" color="#f59e0b" data={chartData} />
                  <MetricBar title="ERROR COUNT" dataKey="errors" color="#ef4444" data={chartData} />
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.3fr) minmax(320px, 0.7fr)", gap: "20px" }}>
                <section className="card">
                  <div className="card-header">
                    <span className="card-title">Recent logs</span>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{logs.length} entries</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {logs.length === 0 ? (
                      <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>No logs yet.</p>
                    ) : logs.slice(0, 8).map((log, index) => (
                      <div key={log.id ?? `${log.message}-${index}`} style={{ display: "grid", gridTemplateColumns: "72px 70px minmax(0, 1fr)", gap: "10px", fontSize: "12px", color: "var(--text-secondary)" }}>
                        <span>{new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        <strong style={{ color: log.level === "error" ? "var(--accent-red)" : log.level === "warn" ? "var(--accent-yellow)" : "var(--accent-green)" }}>
                          {log.level}
                        </strong>
                        <span>{log.message}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="card">
                  <div className="card-header">
                    <span className="card-title">Deployments and AI</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    {deployments[0] ? (
                      <div>
                        <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Latest deployment</p>
                        <strong>{deployments[0].version}</strong>
                      </div>
                    ) : (
                      <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>No deployments yet.</p>
                    )}
                    {latestInsight ? (
                      <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "14px" }}>
                        <p style={{ fontSize: "13px", color: "var(--accent-yellow)", marginBottom: "6px" }}>
                          {latestInsight.severity}
                        </p>
                        <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                          {latestInsight.rootCause ?? latestInsight.reasons?.join(", ") ?? "Anomaly detected."}
                        </p>
                        {latestInsight.recommendation && (
                          <p style={{ fontSize: "13px", color: "var(--text-primary)", marginTop: "8px", lineHeight: 1.5 }}>
                            {latestInsight.recommendation}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                        AI insight appears after anomaly worker detects a threshold breach.
                      </p>
                    )}
                  </div>
                </section>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function MetricLine({
  title,
  data,
  dataKey,
  color,
}: {
  title: string;
  data: Array<Record<string, string | number>>;
  dataKey: string;
  color: string;
}) {
  return (
    <div className="card chart-card">
      <div className="card-header" style={{ marginBottom: "8px" }}>
        <span className="card-title">{title}</span>
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Last {data.length} points</span>
      </div>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#6b7280" }} />
            <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} />
            <Tooltip contentStyle={{ background: "#1e1f26", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", fontSize: "12px" }} />
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function MetricBar({
  title,
  data,
  dataKey,
  color,
}: {
  title: string;
  data: Array<Record<string, string | number>>;
  dataKey: string;
  color: string;
}) {
  return (
    <div className="card chart-card">
      <div className="card-header" style={{ marginBottom: "8px" }}>
        <span className="card-title">{title}</span>
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Last {data.length} points</span>
      </div>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={16}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#6b7280" }} />
            <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} />
            <Tooltip contentStyle={{ background: "#1e1f26", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px", fontSize: "12px" }} />
            <Bar dataKey={dataKey} fill={color} radius={[2, 2, 0, 0]} opacity={0.8} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
