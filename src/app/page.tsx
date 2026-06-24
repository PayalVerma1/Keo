"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Bell, Settings, LayoutGrid, Layers, FileText,
  Rocket, BrainCircuit, Activity, AlertTriangle,
  Clock, TrendingUp, CheckCircle2, LogOut, Loader2
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

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

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ onLogout, userName }: { onLogout: () => void; userName: string }) {
  const router = useRouter();

  const navItems = [
    { label: "Overview",    icon: <LayoutGrid  size={18} />, href: "/" },
    { label: "Services",    icon: <Layers      size={18} />, href: "/services" },
    { label: "Logs",        icon: <FileText    size={18} />, href: "/logs" },
    { label: "Deployments", icon: <Rocket      size={18} />, href: "/deployments" },
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
            id={`nav-${item.label.toLowerCase().replace(" ", "-")}`}
            className={`nav-item${item.href === "/" ? " active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
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
        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px" }}>
          WebSocket: Live
        </div>

        {userName && (
          <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "12px", fontWeight: 500 }}>
            👤 {userName}
          </div>
        )}

        <button
          id="logout-btn"
          onClick={onLogout}
          className="nav-item"
          style={{
            padding: "8px 0",
            color: "var(--accent-red)",
            background: "none",
            border: "none",
            cursor: "pointer",
            width: "100%",
            textAlign: "left",
          }}
        >
          <LogOut size={16} /> Sign Out
        </button>

        <a href="#" className="nav-item" style={{ padding: "8px 0", marginTop: "8px" }}>
          <FileText size={18} /> Docs
        </a>
      </div>
    </aside>
  );
}

// ─── Chart Card ───────────────────────────────────────────────────────────────
function ChartCard({
  title,
  data,
  color,
  opacity = 1,
}: {
  title: string;
  data: ChartPoint[];
  color: string;
  opacity?: number;
}) {
  return (
    <div className="card chart-card">
      <div className="card-header" style={{ marginBottom: "8px" }}>
        <span className="card-title">{title}</span>
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Last 30m</span>
      </div>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={20}>
            <XAxis dataKey="time" hide />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: "#1e1f26",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "6px",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="value" fill={color} radius={[2, 2, 0, 0]} opacity={opacity} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
function ChartSkeleton() {
  return (
    <div className="card chart-card" style={{ justifyContent: "center", alignItems: "center" }}>
      <Loader2 size={24} className="spin" color="var(--text-muted)" />
    </div>
  );
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
        {/* Topbar */}
        <header className="topbar">
          <div className="search-box">
            <Search size={16} color="var(--text-muted)" />
            <input type="text" placeholder="Search telemetry..." />
          </div>

          <div className="topbar-actions">
            <div className="live-badge">
              <div className="status-dot" />
              Live – auto-refresh 30s
            </div>
            <div className="icon-btn"><Bell size={18} /></div>
            <div className="icon-btn"><Settings size={18} /></div>
            <div className="avatar">
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  background: "linear-gradient(45deg, #8b5cf6, #3b82f6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "white",
                }}
              >
                {user?.name?.[0]?.toUpperCase() ?? "U"}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Area */}
        <div className="dashboard-scroll-area">
          {/* Error state */}
          {error && (
            <div
              style={{
                background: "var(--accent-red-dim)",
                border: "1px solid var(--accent-red)",
                borderRadius: "8px",
                padding: "12px 16px",
                color: "var(--accent-red)",
                marginBottom: "24px",
                fontSize: "13px",
              }}
            >
              ⚠ {error} –{" "}
              <button
                style={{ color: "inherit", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                onClick={() => {
                  setError("");
                  setLoading(true);
                  const token = localStorage.getItem("obs_token");
                  if (token) fetchDashboard(token);
                }}
              >
                Retry
              </button>
            </div>
          )}

          <div className="dashboard-grid">
            {/* Left Content Column */}
            <div>
              {/* Stats Row */}
              <div className="stats-row">
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">TOTAL SERVICES</span>
                    <Layers size={16} color="var(--text-secondary)" />
                  </div>
                  <div className="stat-value">
                    {loading ? <Loader2 size={20} className="spin" /> : data?.summary.totalServices ?? 0}
                  </div>
                  <div className="stat-trend trend-up">
                    <TrendingUp size={14} /> All services
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <span className="card-title">ACTIVE ALERTS</span>
                    <AlertTriangle size={16} color="var(--accent-red)" />
                  </div>
                  <div className="stat-value" style={{ color: "var(--accent-red)" }}>
                    {loading ? <Loader2 size={20} className="spin" /> : data?.summary.activeAlerts ?? 0}
                  </div>
                  <div className="stat-trend" style={{ color: "var(--text-secondary)" }}>
                    High CPU or Error rate
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <span className="card-title">AVG LATENCY</span>
                    <Clock size={16} color="var(--text-secondary)" />
                  </div>
                  <div className="stat-value">
                    {loading ? <Loader2 size={20} className="spin" /> : data?.summary.avgLatency ?? "–"}
                  </div>
                  <div className="stat-trend trend-down">
                    <Activity size={14} /> Across all services
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <span className="card-title">ERROR RATE</span>
                    <Activity size={16} color="var(--accent-green)" />
                  </div>
                  <div className="stat-value">
                    {loading ? <Loader2 size={20} className="spin" /> : data?.summary.errorRate ?? "–"}
                  </div>
                  <div className="stat-trend" style={{ color: "var(--text-secondary)" }}>
                    Average across services
                  </div>
                </div>
              </div>

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
                /* No data state */
                <div
                  className="card"
                  style={{
                    marginBottom: "24px",
                    padding: "40px 20px",
                    textAlign: "center",
                    alignItems: "center",
                  }}
                >
                  <Activity size={48} color="var(--text-muted)" style={{ marginBottom: "16px" }} />
                  <p style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>
                    No metrics data yet
                  </p>
                  <p style={{ fontSize: "13px", color: "var(--text-secondary)", maxWidth: "400px" }}>
                    Create a service and push metrics via{" "}
                    <code
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        fontFamily: "monospace",
                      }}
                    >
                      POST /api/metrics
                    </code>{" "}
                    to see live charts here.
                  </p>
                </div>
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
              <div className="card" style={{ flex: 1 }}>
                <div className="card-header" style={{ marginBottom: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <BrainCircuit size={18} color="#a5b4fc" />
                    <span style={{ fontSize: "16px", fontWeight: 600 }}>AI Insights</span>
                  </div>
                </div>

                <div className="insight-item">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <span className="insight-badge critical">CRITICAL</span>
                      <span className="insight-time">2m ago</span>
                    </div>
                    <AlertTriangle size={24} color="var(--text-muted)" opacity={0.3} />
                  </div>
                  <div className="insight-title">Abnormal Latency Spike: Auth-Service</div>
                  <div className="insight-desc">
                    Auth-Service P99 latency increased by 450ms. Potential connection pool exhaustion
                    detected in 'db-cluster-01'.
                  </div>
                  <div>
                    <button className="btn-outline">INVESTIGATE ROOT CAUSE</button>
                  </div>
                </div>

                <div className="insight-item">
                  <div>
                    <span className="insight-badge warning">WARNING</span>
                    <span className="insight-time">15m ago</span>
                  </div>
                  <div className="insight-title">Memory Leak Warning</div>
                  <div className="insight-desc">
                    Container 'ingest-worker-3' showing linear memory growth (85% utilization).
                    Estimated OOM in 42 minutes.
                  </div>
                  <div>
                    <button className="btn-outline">RESTART NODE</button>
                    <button className="btn-outline">IGNORE</button>
                  </div>
                </div>
              </div>

              {/* Live Stream */}
              <div className="card" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                <div className="card-header">
                  <span className="card-title">LIVE STREAM</span>
                  <div className="stat-trend trend-up">
                    <div className="status-dot" /> STREAMING
                  </div>
                </div>
                <div className="terminal" id="live-stream-terminal">
                  <div>
                    <span className="term-time">
                      {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                    <span className="term-info">[INFO]</span>
                    Dashboard loaded – {data?.summary.totalServices ?? 0} service(s) monitored
                  </div>
                  <div>
                    <span className="term-time">
                      {new Date(Date.now() - 4000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                    <span className="term-info">[INFO]</span>
                    Re-indexing shard #4 completed
                  </div>
                  <div>
                    <span className="term-time">
                      {new Date(Date.now() - 8000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                    <span className="term-err">[ERR]</span>
                    Failed to fetch metrics: Timeout
                  </div>
                  <div>
                    <span className="term-time">
                      {new Date(Date.now() - 12000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                    <span className="term-warn">[WARN]</span>
                    Throttling API request client:831...
                  </div>
                  <div>
                    <span className="term-time">
                      {new Date(Date.now() - 20000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </span>
                    <span className="term-info">[INFO]</span>
                    Auth-Service: Token verified
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
