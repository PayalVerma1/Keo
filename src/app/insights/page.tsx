"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Activity, AlertTriangle, BrainCircuit, Layers, Loader2 } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { useSocketState } from "@/lib/useSocketState";
import { Topbar } from "@/components/layout/topbar";

interface Service {
  id: string;
  name: string;
}

interface Insight {
  id?: string;
  severity: string;
  rootCause?: string;
  recommendation?: string;
  reasons?: string[];
  createdAt?: string;
  serviceId: string;
  serviceName?: string;
}

export default function InsightsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [services, setServices] = useState<Service[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    const loadInsights = async () => {
      try {
        const servicesRes = await fetch("/api/services");
        if (!servicesRes.ok) throw new Error("Failed to load services");
        const serviceList = (await servicesRes.json()) as Service[];
        setServices(serviceList);

        const insightRequests = serviceList.map(async (service) => {
          const res = await fetch(`/api/insights/${service.id}`);
          if (!res.ok) return [] as Insight[];
          const entries = (await res.json()) as Array<Omit<Insight, "serviceName">>;
          return entries.map((entry) => ({ ...entry, serviceId: service.id, serviceName: service.name }));
        });

        const settled = await Promise.all(insightRequests);
        setInsights(settled.flat());
      } catch (err: any) {
        setError(err.message || "Unable to load insights");
      } finally {
        setLoading(false);
      }
    };

    loadInsights();
  }, [status]);

  const summary = useMemo(() => ({
    total: insights.length,
    critical: insights.filter((item) => item.severity?.toLowerCase() === "critical").length,
    warning: insights.filter((item) => item.severity?.toLowerCase() === "warning").length,
  }), [insights]);

  const handleLogout = () => signOut({ callbackUrl: "/login" });
  const socketState = useSocketState();

  if (status === "loading" || status === "unauthenticated") return null;

  return (
    <div className="layout-wrapper">
      <Sidebar activePath="/insights" onLogout={handleLogout} userName={session?.user?.name ?? ""} socketState={socketState} />
      <main className="main-content">
        <Topbar userName={session?.user?.name ?? undefined} />
        <div className="dashboard-scroll-area">
          <div className="page-hero">
            <div className="page-title-wrap">
              <h1 className="page-title">AI Insights</h1>
              <p className="page-subtitle">Anomalies and recommendations fetched from the AI insight backend for each service.</p>
            </div>
          </div>

          {error && <div className="form-error" style={{ marginBottom: "16px" }}>{error}</div>}

          <div className="stats-row" style={{ marginBottom: "24px" }}>
            <div className="card">
              <div className="card-header">
                <span className="card-title">TOTAL INSIGHTS</span>
                <BrainCircuit size={16} color="var(--text-secondary)" />
              </div>
              <div className="stat-value">{loading ? "…" : summary.total}</div>
              <div className="stat-trend trend-up">Detected issues</div>
            </div>
            <div className="card">
              <div className="card-header">
                <span className="card-title">CRITICAL</span>
                <AlertTriangle size={16} color="var(--accent-red)" />
              </div>
              <div className="stat-value" style={{ color: "var(--accent-red)" }}>{loading ? "…" : summary.critical}</div>
              <div className="stat-trend" style={{ color: "var(--text-secondary)" }}>Immediate action</div>
            </div>
            <div className="card">
              <div className="card-header">
                <span className="card-title">WARNINGS</span>
                <Activity size={16} color="var(--accent-yellow)" />
              </div>
              <div className="stat-value" style={{ color: "var(--accent-yellow)" }}>{loading ? "…" : summary.warning}</div>
              <div className="stat-trend trend-down">Watchlist</div>
            </div>
            <div className="card">
              <div className="card-header">
                <span className="card-title">SERVICES</span>
                <Layers size={16} color="var(--text-secondary)" />
              </div>
              <div className="stat-value">{loading ? "…" : services.length}</div>
              <div className="stat-trend" style={{ color: "var(--text-secondary)" }}>Analyzed sources</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">LATEST FINDINGS</span>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{insights.length} entries</span>
            </div>

            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
                <Loader2 size={24} className="spin" color="var(--accent-green)" />
              </div>
            ) : insights.length === 0 ? (
              <div style={{ padding: "24px 0", color: "var(--text-secondary)" }}>No AI insights have been generated yet.</div>
            ) : (
              <div className="log-list">
                {insights
                  .slice()
                  .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
                  .slice(0, 80)
                  .map((insight, index) => (
                    <div key={`${insight.serviceId}-${insight.createdAt}-${index}`} className="log-row">
                      <span>{insight.createdAt ? new Date(insight.createdAt).toLocaleDateString() : "—"}</span>
                      <strong style={{ color: insight.severity?.toLowerCase() === "critical" ? "var(--accent-red)" : insight.severity?.toLowerCase() === "warning" ? "var(--accent-yellow)" : "var(--accent-green)" }}>
                        {insight.severity?.toUpperCase() ?? "INFO"}
                      </strong>
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>{insight.serviceName ?? insight.serviceId}</div>
                        <div style={{ color: "var(--text-secondary)", marginBottom: "6px" }}>{insight.rootCause ?? insight.reasons?.join(", ") ?? "No root cause provided."}</div>
                        {insight.recommendation && <div style={{ color: "var(--text-primary)" }}>{insight.recommendation}</div>}
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
