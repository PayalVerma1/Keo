"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Activity, Clock, Layers, Loader2, Rocket } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { useSocketState } from "@/lib/useSocketState";
import { Topbar } from "@/components/layout/topbar";

interface Service {
  id: string;
  name: string;
  description?: string;
}

interface Deployment {
  id?: string;
  version: string;
  serviceId: string;
  serviceName?: string;
  createdAt: string;
}

export default function DeploymentsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [services, setServices] = useState<Service[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    const loadDeployments = async () => {
      try {
        const servicesRes = await fetch("/api/services");
        if (!servicesRes.ok) throw new Error("Failed to load services");
        const serviceList = (await servicesRes.json()) as Service[];
        setServices(serviceList);

        const deploymentRequests = serviceList.map(async (service) => {
          const res = await fetch(`/api/deployments/${service.id}`);
          if (!res.ok) return [] as Deployment[];
          const entries = (await res.json()) as Array<Omit<Deployment, "serviceName">>;
          return entries.map((entry) => ({ ...entry, serviceId: service.id, serviceName: service.name }));
        });

        const settled = await Promise.all(deploymentRequests);
        setDeployments(settled.flat());
      } catch (err: any) {
        setError(err.message || "Unable to load deployments");
      } finally {
        setLoading(false);
      }
    };

    loadDeployments();
  }, [status]);

  const summary = useMemo(() => ({
    total: deployments.length,
    latestVersion: deployments[0]?.version ?? "—",
    servicesWithDeployments: new Set(deployments.map((item) => item.serviceId)).size,
  }), [deployments]);

  const handleLogout = () => signOut({ callbackUrl: "/login" });
  const socketState = useSocketState();

  if (status === "loading" || status === "unauthenticated") return null;

  return (
    <div className="layout-wrapper">
      <Sidebar activePath="/deployments" onLogout={handleLogout} userName={session?.user?.name ?? ""} socketState={socketState} />
      <main className="main-content">
        <Topbar userName={session?.user?.name ?? undefined} />
        <div className="dashboard-scroll-area">
          <div className="page-hero">
            <div className="page-title-wrap">
              <h1 className="page-title">Deployments</h1>
              <p className="page-subtitle">Deployment events fetched from the backend for every monitored service.</p>
            </div>
          </div>

          {error && <div className="form-error" style={{ marginBottom: "16px" }}>{error}</div>}

          <div className="stats-row" style={{ marginBottom: "24px" }}>
            <div className="card">
              <div className="card-header">
                <span className="card-title">TOTAL DEPLOYMENTS</span>
                <Rocket size={16} color="var(--text-secondary)" />
              </div>
              <div className="stat-value">{loading ? "…" : summary.total}</div>
              <div className="stat-trend trend-up">Recorded releases</div>
            </div>
            <div className="card">
              <div className="card-header">
                <span className="card-title">LATEST VERSION</span>
                <Activity size={16} color="var(--accent-green)" />
              </div>
              <div className="stat-value" style={{ color: "var(--accent-green)" }}>{loading ? "…" : summary.latestVersion}</div>
              <div className="stat-trend" style={{ color: "var(--text-secondary)" }}>Most recent release</div>
            </div>
            <div className="card">
              <div className="card-header">
                <span className="card-title">ACTIVE SERVICES</span>
                <Layers size={16} color="var(--text-secondary)" />
              </div>
              <div className="stat-value">{loading ? "…" : summary.servicesWithDeployments}</div>
              <div className="stat-trend trend-down">With deployment history</div>
            </div>
            <div className="card">
              <div className="card-header">
                <span className="card-title">MONITORED</span>
                <Clock size={16} color="var(--accent-yellow)" />
              </div>
              <div className="stat-value" style={{ color: "var(--accent-yellow)" }}>{loading ? "…" : services.length}</div>
              <div className="stat-trend" style={{ color: "var(--text-secondary)" }}>Services tracked</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title">RECENT RELEASES</span>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{deployments.length} entries</span>
            </div>

            {loading ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
                <Loader2 size={24} className="spin" color="var(--accent-green)" />
              </div>
            ) : deployments.length === 0 ? (
              <div style={{ padding: "24px 0", color: "var(--text-secondary)" }}>No deployments have been recorded for your services yet.</div>
            ) : (
              <div className="log-list">
                {deployments
                  .slice()
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .slice(0, 80)
                  .map((deployment, index) => (
                    <div key={`${deployment.serviceId}-${deployment.createdAt}-${index}`} className="log-row">
                      <span>{new Date(deployment.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      <strong style={{ color: "var(--accent-green)" }}>{deployment.version}</strong>
                      <div>
                        <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "4px" }}>{deployment.serviceName ?? deployment.serviceId}</div>
                        <div style={{ color: "var(--text-secondary)" }}>Released on {new Date(deployment.createdAt).toLocaleDateString()}</div>
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
