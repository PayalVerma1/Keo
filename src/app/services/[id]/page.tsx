"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Check,
  Copy,
  Cpu,
  HardDrive,
  Key,
  Loader2,
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
import { socket as sharedSocket } from "@/lib/socket";
import { useSocketState } from "@/lib/useSocketState";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

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
  const [error, setError] = useState("");
  const [user, setUser] = useState<{ name: string } | null>(null);
  const socketState = useSocketState();
  const [mounted, setMounted] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

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

    const storedUser = localStorage.getItem("obs_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {}
    }

    loadTelemetry(token)
      .catch((nextError) => setError(nextError instanceof Error ? nextError.message : "Telemetry load failed."))
      .finally(() => setLoading(false));
  }, [loadTelemetry, router]);

  useEffect(() => {
    if (!serviceId || !mounted) return;

    const socket = sharedSocket;

    // If socket is already connected, join the room immediately
    if (socket.connected) {
      socket.emit("service:join", serviceId);
    }

    // Also join on future reconnects
    const onConnect = () => socket.emit("service:join", serviceId);
    socket.on("connect", onConnect);

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

    return () => {
      socket.emit("service:left", serviceId);
      socket.off("connect", onConnect);
      socket.off("metric:created");
      socket.off("log:created");
      socket.off("deployment:created");
      socket.off("anomaly:detected");
    };
  }, [mounted, serviceId]);


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

  const handleLogout = () => {
    localStorage.removeItem("obs_token");
    localStorage.removeItem("obs_user");
    router.replace("/login");
  };

  const copyToClipboard = (text: string, onDone: () => void) => {
    navigator.clipboard.writeText(text).then(() => {
      onDone();
      setTimeout(onDone, 2000);
    });
  };

  const handleGenerateApiKey = async () => {
    const token = localStorage.getItem("obs_token");
    if (!token) { router.replace("/login"); return; }
    setGeneratingKey(true);
    try {
      const res = await fetch(`/api/services/${serviceId}/api-key`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to generate API key");
      setApiKey(data.apiKey);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGeneratingKey(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="layout-wrapper">
      <Sidebar activePath="/services" onLogout={handleLogout} userName={user?.name ?? ""} />
      <main className="main-content">
        <Topbar userName={user?.name} />

        <div className="dashboard-scroll-area">
          <div className="page-hero">
            <div className="page-title-wrap">
              <h1 className="page-title">
                {service?.name ?? "Service monitor"}
              </h1>
              <p className="page-subtitle">
                Live telemetry from your SDK — metrics, logs, and deployments sent by your connected service.
              </p>
            </div>
          </div>

          {/* ── Service ID + API Key cards ─────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
            {/* Service ID */}
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div className="card-header">
                <span className="card-title">Service ID</span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Use in SDK config</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(0,0,0,0.25)", borderRadius: "8px", padding: "10px 14px", border: "1px solid rgba(255,255,255,0.07)" }}>
                <code style={{ flex: 1, fontSize: "12px", color: "#a5b4fc", wordBreak: "break-all", fontFamily: "monospace" }}>
                  {serviceId}
                </code>
                <button
                  type="button"
                  onClick={() => copyToClipboard(serviceId, () => setCopiedId((v) => !v))}
                  style={{ background: "none", border: "none", cursor: "pointer", color: copiedId ? "var(--accent-green)" : "var(--text-muted)", flexShrink: 0, padding: "2px", transition: "color 0.2s" }}
                  title="Copy Service ID"
                >
                  {copiedId ? <Check size={15} /> : <Copy size={15} />}
                </button>
              </div>
            </div>

            {/* API Key */}
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div className="card-header">
                <span className="card-title">API Key</span>
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>For SDK authentication</span>
              </div>
              {apiKey ? (
                <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(0,0,0,0.25)", borderRadius: "8px", padding: "10px 14px", border: "1px solid rgba(46,200,133,0.25)" }}>
                  <code style={{ flex: 1, fontSize: "12px", color: "var(--accent-green)", wordBreak: "break-all", fontFamily: "monospace", maxHeight: "48px", overflow: "hidden" }}>
                    {apiKey}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(apiKey, () => setCopiedKey((v) => !v))}
                    style={{ background: "none", border: "none", cursor: "pointer", color: copiedKey ? "var(--accent-green)" : "var(--text-muted)", flexShrink: 0, padding: "2px", transition: "color 0.2s" }}
                    title="Copy API Key"
                  >
                    {copiedKey ? <Check size={15} /> : <Copy size={15} />}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn-outline"
                  onClick={handleGenerateApiKey}
                  disabled={generatingKey}
                  style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}
                >
                  {generatingKey ? <Loader2 size={14} className="spin" /> : <Key size={14} />}
                  {generatingKey ? "Generating…" : "Generate API Key"}
                </button>
              )}
            </div>
          </div>


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
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                    Connect your service using the SDK to start seeing real metrics, logs, and deployments here.
                  </p>
                </div>
              ) : (
                <div className="charts-grid" style={{ marginBottom: "24px" }}>
                  <MetricLine title="CPU USAGE (%)" dataKey="cpu" color="#3b82f6" data={chartData} />
                  <MetricBar title="MEMORY (%)" dataKey="memory" color="#10B981" data={chartData} />
                  <MetricLine title="LATENCY (MS)" dataKey="latency" color="#f59e0b" data={chartData} />
                  <MetricBar title="ERROR COUNT" dataKey="errors" color="#ef4444" data={chartData} />
                </div>
              )}

              <div className="content-grid">
                <section className="card">
                  <div className="card-header">
                    <span className="card-title">Recent logs</span>
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{logs.length} entries</span>
                  </div>
                  <div className="log-list">
                    {logs.length === 0 ? (
                      <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>No logs yet.</p>
                    ) : logs.slice(0, 8).map((log, index) => (
                      <div key={log.id ?? `${log.message}-${index}`} className="log-row">
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
                      <div className="insight-card">
                        <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Latest deployment</p>
                        <strong>{deployments[0].version}</strong>
                      </div>
                    ) : (
                      <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>No deployments yet.</p>
                    )}
                    {latestInsight ? (
                      <div className="insight-card">
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
