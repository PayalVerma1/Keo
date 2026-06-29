"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Activity, Clock, FileText, Layers, Loader2 } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

interface Service {
  id: string;
  name: string;
  description?: string;
}

interface LogEntry {
  id?: string;
  level: string;
  message: string;
  createdAt: string;
  serviceId: string;
  serviceName?: string;
}

export default function LogsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<{ name: string } | null>(null);

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

    const loadLogs = async () => {
      try {
        const servicesRes = await fetch("/api/services", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!servicesRes.ok) throw new Error("Failed to load services");
        const serviceList = (await servicesRes.json()) as Service[];
        setServices(serviceList);

        const logRequests = serviceList.map(async (service) => {
          const res = await fetch(`/api/logs/${service.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) return [] as LogEntry[];
          const entries = (await res.json()) as Array<Omit<LogEntry, "serviceName">>;
          return entries.map((entry) => ({ ...entry, serviceId: service.id, serviceName: service.name }));
        });

        const settled = await Promise.all(logRequests);
        setLogs(settled.flat());
      } catch (err: any) {
        setError(err.message || "Unable to load logs");
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, [router]);

  const summary = useMemo(() => {
    const total = logs.length;
    const errors = logs.filter((entry) => entry.level === "error").length;
    const warnings = logs.filter((entry) => entry.level === "warn").length;
    return { total, errors, warnings };
  }, [logs]);

  const handleLogout = () => {
    localStorage.removeItem("obs_token");
    localStorage.removeItem("obs_user");
    router.replace("/login");
  };

  if (!mounted) return null;

  return (
    <div className="layout-wrapper">
      <Sidebar activePath="/logs" onLogout={handleLogout} userName={user?.name ?? ""} />
      <main className="main-content">
        <Topbar userName={user?.name} />
        <div className="dashboard-scroll-area">
          <div className="page-hero">
            <div className="page-title-wrap">
              <h1 className="page-title">Logs</h1>
              <p className="page-subtitle">Live application events fetched directly from your service log streams.</p>
            </div>
          </div>

          {error && <div className="form-error" style={{ marginBottom: "16px" }}>{error}</div>}

          <div className="stats-row" style={{ marginBottom: "24px" }}>
            <div className="card">
              <div className="card-header">
                <span className="card-title">TOTAL LOGS</span>
                <FileText size={16} color="var(--text-secondary)" />
              </div>
              <div className="stat-value">{loading ? "…" : summary.total}</div>
              <div className="stat-trend trend-up">Across monitored services</div>
            </div>
            <div className="card">
              <div className="card-header">
                <span className="card-title">ERROR EVENTS</span>
                <AlertTriangle size={16} color="var(--accent-red)" />
              </div>
              <div className="stat-value" style={{ color: "var(--accent-red)" }}>{loading ? "…" : summary.errors}</div>
              <div className="stat-trend" style={{ color: "var(--text-secondary)" }}>Needs attention</div>
            </div>
            <div className="card">
              <div className="card-header">
                <span className="card-title">WARNINGS</span>
                <Activity size={16} color="var(--accent-yellow)" />
              </div>
              <div className="stat-value" style={{ color: "var(--accent-yellow)" }}>{loading ? "…" : summary.warnings}</div>
              <div className="stat-trend trend-down">Threshold alerts</div>
            </div>
            <div className="card">
              <div className="card-header">
                <span className="card-title">SERVICES</span>
                <Layers size={16} color="var(--text-secondary)" />
              </div>
              <div className="stat-value">{loading ? "…" : services.length}</div>
              <div className="stat-trend" style={{ color: "var(--text-secondary)" }}>Active sources</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">RECENT EVENTS</span>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{logs.length} entries</span>
            </div>

            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
                <Loader2 size={24} className="spin" color="var(--accent-green)" />
              </div>
            ) : logs.length === 0 ? (
              <div style={{ padding: "24px 0", color: "var(--text-secondary)" }}>No logs have been recorded yet for your services.</div>
            ) : (
              <div className="log-list">
                {logs
                  .slice()
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 80)
                  .map((entry, index) => (
                    <div key={`${entry.serviceId}-${entry.createdAt}-${index}`} className="log-row">
                      <span>{new Date(entry.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      <strong style={{ color: entry.level === "error" ? "var(--accent-red)" : entry.level === "warn" ? "var(--accent-yellow)" : "var(--accent-green)" }}>
                        {entry.level.toUpperCase()}
                      </strong>
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>{entry.serviceName ?? entry.serviceId}</div>
                        <div style={{ color: "var(--text-secondary)" }}>{entry.message}</div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
