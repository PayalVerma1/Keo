"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Activity,
  AlertCircle,
  Bell,
  BrainCircuit,
  Cpu,
  ExternalLink,
  HardDrive,
  Loader2,
  Play,
  Settings,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/dashboard/app-shell";
import { ErrorBanner, LoadingBlock } from "@/components/dashboard/cards";
import { ServiceBarChart, ServiceLineChart } from "@/components/dashboard/charts";
import type { Deployment, Insight, LogEntry, Metric, Service } from "@/components/dashboard/types";
import { logColor, relativeTime } from "@/components/dashboard/utils";

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

  const generateTelemetry = async () => {
    const token = localStorage.getItem("obs_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    setGenerating(true);
    setError("");
    setNotice("Queued telemetry events. Workers save them, then charts refresh from PostgreSQL.");

    try {
      const version = `v${new Date().getHours()}.${new Date().getMinutes()}.${Math.floor(Math.random() * 100)}`;

      await fetch("/api/deployments", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ serviceId, version }),
      });

      const metricRequests = Array.from({ length: 12 }, (_, index) => {
        const isSpike = index > 8;
        return fetch("/api/metrics", {
          method: "POST",
          headers: authHeaders(token),
          body: JSON.stringify({
            serviceId,
            cpu: Math.round((isSpike ? 86 + Math.random() * 12 : 35 + Math.random() * 42) * 10) / 10,
            memory: Math.round((isSpike ? 78 + Math.random() * 14 : 40 + Math.random() * 30) * 10) / 10,
            latency: Math.round(isSpike ? 850 + Math.random() * 550 : 110 + Math.random() * 260),
            throughput: Math.round(420 + Math.random() * 480),
            errors: Math.round((isSpike ? 7 + Math.random() * 9 : Math.random() * 3) * 10) / 10,
          }),
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
      if (responses.some((response) => !response.ok)) throw new Error("Some telemetry events could not be queued.");

      await wait(1500);
      await loadTelemetry(token);
      await wait(2500);
      await loadTelemetry(token);
      setNotice("Telemetry saved. Charts are generated from database metrics.");
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
    errors: Number((metric.errors ?? metric.errorRate ?? 0).toFixed(1)),
  })), [metrics]);

  const latest = metrics.at(-1);
  const topInsight = insights[0];

  if (!mounted) return null;

  return (
    <AppShell active="/services">
      <header className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 18, fontWeight: 700 }}>{service?.name ?? "Service monitor"}</span>
          <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "rgba(46,200,133,0.12)", color: "#2ee59d", border: "1px solid rgba(46,200,133,0.3)" }}>
            Operational
          </span>
        </div>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
          Uptime: <span style={{ color: "#2ee59d", fontWeight: 600 }}>{latest ? Math.max(0, 100 - (latest.errors ?? latest.errorRate ?? 0)).toFixed(2) : "99.99"}%</span>
        </span>
        <button className="icon-btn" type="button" aria-label="Notifications"><Bell size={18} /></button>
        <button className="icon-btn" type="button" aria-label="Settings"><Settings size={18} /></button>
        <button className="avatar" type="button" aria-label="Open profile" onClick={() => router.push("/profile")} />
      </header>

      <div className="dashboard-scroll-area">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{service?.name ?? "Service monitor"}</h1>
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Generate telemetry to run: API producer → Redis Stream → worker → PostgreSQL → chart.
            </p>
          </div>
          <button className="form-submit" onClick={generateTelemetry} type="button" disabled={generating} style={{ width: "auto", minWidth: 220, padding: "10px 18px", display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
            {generating ? <Loader2 size={16} className="spin" /> : <Play size={16} />}
            {generating ? "Generating telemetry" : "Generate test telemetry"}
          </button>
        </div>

        {notice && <div className="card" style={{ marginBottom: 16, borderColor: "var(--accent-green)", color: "var(--text-secondary)" }}>{notice}</div>}
        {error && <ErrorBanner message={error} />}

        {loading ? (
          <LoadingBlock label="Loading service telemetry..." />
        ) : (
          <>
            <div className="stats-row" style={{ marginBottom: 24 }}>
              <MetricStat label="CPU" value={`${latest?.cpu?.toFixed(1) ?? 0}%`} icon={<Cpu size={16} />} color="var(--accent-blue)" />
              <MetricStat label="Memory" value={`${latest?.memory?.toFixed(1) ?? 0}%`} icon={<HardDrive size={16} />} color="var(--accent-green)" />
              <MetricStat label="Latency" value={`${latest?.latency?.toFixed(0) ?? 0}ms`} icon={<Zap size={16} />} color="var(--accent-yellow)" />
              <MetricStat label="Errors" value={`${(latest?.errors ?? latest?.errorRate ?? 0).toFixed(1)}`} icon={<AlertCircle size={16} />} color="var(--accent-red)" />
            </div>

            {metrics.length === 0 ? (
              <div className="card" style={{ textAlign: "center", padding: "56px 20px", marginBottom: 24 }}>
                <Activity size={48} color="var(--text-muted)" style={{ margin: "0 auto 16px" }} />
                <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No telemetry yet</p>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20 }}>
                  Click generate test telemetry to send metrics, logs, and deployment events through Redis Streams.
                </p>
                <button className="form-submit" onClick={generateTelemetry} disabled={generating} type="button" style={{ width: "auto", margin: "0 auto", padding: "10px 18px" }}>
                  {generating ? "Queueing events" : "Generate now"}
                </button>
              </div>
            ) : (
              <div className="charts-grid" style={{ marginBottom: 24 }}>
                <ChartCard title="CPU Usage (%)"><ServiceLineChart data={chartData} dataKey="cpu" color="#3b82f6" /></ChartCard>
                <ChartCard title="Memory (%)"><ServiceBarChart data={chartData} dataKey="memory" color="#10B981" /></ChartCard>
                <ChartCard title="Latency (ms)"><ServiceLineChart data={chartData} dataKey="latency" color="#f59e0b" /></ChartCard>
                <ChartCard title="Error Count"><ServiceBarChart data={chartData} dataKey="errors" color="#ef4444" /></ChartCard>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.3fr) minmax(320px, 0.7fr)", gap: 20 }}>
              <section className="card">
                <div className="card-header">
                  <span className="card-title">Recent Logs</span>
                  <button className="btn-outline" onClick={() => router.push("/logs")} type="button"><ExternalLink size={13} /> Logs</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {logs.length === 0 ? <p style={{ color: "var(--text-secondary)", fontSize: 13 }}>No logs yet.</p> : logs.slice(0, 8).map((log, index) => (
                    <div key={log.id ?? index} style={{ display: "grid", gridTemplateColumns: "72px 70px minmax(0, 1fr)", gap: 10, fontSize: 12, color: "var(--text-secondary)" }}>
                      <span>{new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      <strong style={{ color: logColor(log.level) }}>{log.level}</strong>
                      <span>{log.message}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="card">
                <div className="card-header"><span className="card-title">Deployments and AI</span></div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {deployments[0] ? (
                    <div>
                      <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>Latest deployment</p>
                      <strong>{deployments[0].version}</strong>
                      <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{relativeTime(deployments[0].createdAt)}</p>
                    </div>
                  ) : <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>No deployments yet.</p>}

                  {topInsight ? (
                    <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: 14 }}>
                      <p style={{ fontSize: 13, color: "var(--accent-yellow)", marginBottom: 6 }}>{topInsight.severity}</p>
                      <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{topInsight.rootCause}</p>
                      <p style={{ fontSize: 13, color: "var(--text-primary)", marginTop: 8, lineHeight: 1.5 }}>{topInsight.recommendation}</p>
                    </div>
                  ) : <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>AI insight appears after anomaly worker detects a threshold breach.</p>}
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function MetricStat({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">{label}</span>
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="stat-value" style={{ color }}>{value}</div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card chart-card">
      <div className="card-header" style={{ marginBottom: 8 }}>
        <span className="card-title">{title}</span>
      </div>
      <div className="chart-wrapper">{children}</div>
    </div>
  );
}
