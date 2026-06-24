"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  LayoutGrid, Layers, FileText, Rocket, BrainCircuit,
  Bell, Settings, Search, Activity, ArrowLeft,
  Cpu, HardDrive, Zap, AlertCircle, Loader2
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

interface Metric {
  id: string;
  cpu: number;
  memory: number;
  latency: number;
  errors: number;
  throughput: number;
  createdAt: string;
}

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
          <a key={item.href} href={item.href} className={`nav-item${active === item.href ? " active" : ""}`}
            onClick={(e) => { e.preventDefault(); router.push(item.href); }}>
            {item.icon} {item.label}
          </a>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="status-indicator"><div className="status-dot" />Connected</div>
        <div style={{ fontSize:"12px", color:"var(--text-muted)", marginBottom:"24px" }}>WebSocket: Live</div>
        <a href="#" className="nav-item" style={{ padding:0 }}><FileText size={18} /> Docs</a>
      </div>
    </aside>
  );
}

export default function ServiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const serviceId = params?.id as string;

  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [serviceName, setServiceName] = useState("Service");
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("obs_token");
    if (!token) { router.replace("/login"); return; }

    const fetchData = async () => {
      try {
        // Fetch service name
        const svcRes = await fetch("/api/services", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (svcRes.ok) {
          const services = await svcRes.json();
          const svc = services.find((s: any) => s.id === serviceId);
          if (svc) setServiceName(svc.name);
        }
        // Fetch metrics for this service
        const mRes = await fetch(`/api/services/${serviceId}/metrics`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (mRes.ok) {
          const data = await mRes.json();
          setMetrics(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router, serviceId]);

  const chartData = metrics.slice(-20).map((m, i) => ({
    time: new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    cpu: parseFloat(m.cpu.toFixed(1)),
    memory: parseFloat(m.memory.toFixed(1)),
    latency: parseFloat(m.latency.toFixed(0)),
    errors: parseFloat(m.errors.toFixed(2)),
  }));

  const latest = metrics[metrics.length - 1];

  if (!mounted) return null;

  return (
    <div className="layout-wrapper">
      <Sidebar active="/services" />
      <main className="main-content">
        <header className="topbar">
          <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
            <button className="icon-btn" onClick={() => router.push("/services")}>
              <ArrowLeft size={18} />
            </button>
            <div className="search-box">
              <Search size={16} color="var(--text-muted)" />
              <input type="text" placeholder="Search metrics..." />
            </div>
          </div>
          <div className="topbar-actions">
            <div className="live-badge"><div className="status-dot" />Live</div>
            <div className="icon-btn"><Bell size={18} /></div>
            <div className="icon-btn"><Settings size={18} /></div>
            <div className="avatar">
              <div style={{ width:"100%", height:"100%", background:"linear-gradient(45deg, #8b5cf6, #3b82f6)" }} />
            </div>
          </div>
        </header>

        <div className="dashboard-scroll-area">
          <div style={{ marginBottom:"24px" }}>
            <h1 style={{ fontSize:"22px", fontWeight:700, marginBottom:"4px" }}>{serviceName}</h1>
            <p style={{ fontSize:"13px", color:"var(--text-secondary)" }}>
              Real-time metrics from the last {metrics.length} data points
            </p>
          </div>

          {loading ? (
            <div style={{ display:"flex", justifyContent:"center", alignItems:"center", height:"200px" }}>
              <Loader2 size={32} className="spin" color="var(--accent-green)" />
            </div>
          ) : metrics.length === 0 ? (
            <div className="card" style={{ textAlign:"center", padding:"60px 20px" }}>
              <Activity size={48} color="var(--text-muted)" style={{ margin:"0 auto 16px" }} />
              <p style={{ fontSize:"16px", fontWeight:600, marginBottom:"8px" }}>No metrics yet</p>
              <p style={{ fontSize:"13px", color:"var(--text-secondary)" }}>
                Push metrics via <code style={{fontFamily:"monospace"}}>POST /api/metrics</code> to start seeing data here.
              </p>
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="stats-row" style={{ marginBottom:"24px" }}>
                {[
                  { label:"CPU", value: `${latest?.cpu?.toFixed(1) ?? 0}%`, icon: <Cpu size={16} />, color:"var(--accent-blue)" },
                  { label:"MEMORY", value: `${latest?.memory?.toFixed(1) ?? 0} GB`, icon: <HardDrive size={16} />, color:"var(--accent-green)" },
                  { label:"LATENCY", value: `${latest?.latency?.toFixed(0) ?? 0}ms`, icon: <Zap size={16} />, color:"var(--accent-yellow)" },
                  { label:"ERROR RATE", value: `${latest?.errors?.toFixed(2) ?? 0}%`, icon: <AlertCircle size={16} />, color:"var(--accent-red)" },
                ].map((s) => (
                  <div key={s.label} className="card">
                    <div className="card-header">
                      <span className="card-title">{s.label}</span>
                      <span style={{ color: s.color }}>{s.icon}</span>
                    </div>
                    <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Charts */}
              <div className="charts-grid">
                <div className="card chart-card">
                  <div className="card-header" style={{ marginBottom:"8px" }}>
                    <span className="card-title">CPU USAGE (%)</span>
                    <span style={{ fontSize:"11px", color:"var(--text-muted)" }}>Last {chartData.length} points</span>
                  </div>
                  <div className="chart-wrapper">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="time" tick={{ fontSize:10, fill:"#6b7280" }} />
                        <YAxis tick={{ fontSize:10, fill:"#6b7280" }} />
                        <Tooltip contentStyle={{ background:"#1e1f26", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"6px", fontSize:"12px" }} />
                        <Line type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card chart-card">
                  <div className="card-header" style={{ marginBottom:"8px" }}>
                    <span className="card-title">MEMORY (GB)</span>
                    <span style={{ fontSize:"11px", color:"var(--text-muted)" }}>Last {chartData.length} points</span>
                  </div>
                  <div className="chart-wrapper">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} barSize={16}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="time" tick={{ fontSize:10, fill:"#6b7280" }} />
                        <YAxis tick={{ fontSize:10, fill:"#6b7280" }} />
                        <Tooltip contentStyle={{ background:"#1e1f26", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"6px", fontSize:"12px" }} />
                        <Bar dataKey="memory" fill="#10B981" radius={[2,2,0,0]} opacity={0.8} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card chart-card">
                  <div className="card-header" style={{ marginBottom:"8px" }}>
                    <span className="card-title">LATENCY (MS)</span>
                    <span style={{ fontSize:"11px", color:"var(--text-muted)" }}>Last {chartData.length} points</span>
                  </div>
                  <div className="chart-wrapper">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="time" tick={{ fontSize:10, fill:"#6b7280" }} />
                        <YAxis tick={{ fontSize:10, fill:"#6b7280" }} />
                        <Tooltip contentStyle={{ background:"#1e1f26", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"6px", fontSize:"12px" }} />
                        <Line type="monotone" dataKey="latency" stroke="#f59e0b" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card chart-card">
                  <div className="card-header" style={{ marginBottom:"8px" }}>
                    <span className="card-title">ERROR RATE (%)</span>
                    <span style={{ fontSize:"11px", color:"var(--text-muted)" }}>Last {chartData.length} points</span>
                  </div>
                  <div className="chart-wrapper">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} barSize={16}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="time" tick={{ fontSize:10, fill:"#6b7280" }} />
                        <YAxis tick={{ fontSize:10, fill:"#6b7280" }} />
                        <Tooltip contentStyle={{ background:"#1e1f26", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"6px", fontSize:"12px" }} />
                        <Bar dataKey="errors" fill="#ef4444" radius={[2,2,0,0]} opacity={0.7} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
