"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  CheckCircle2,
  ChevronRight,
  Clock,
  Layers,
  Loader2,
  Plus,
} from "lucide-react";
import { AppShell, AppTopbar } from "@/components/dashboard/app-shell";
import { EmptyState, ErrorBanner, LoadingBlock } from "@/components/dashboard/cards";
import type { Service } from "@/components/dashboard/types";

export default function ServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newService, setNewService] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);
  const [mounted, setMounted] = useState(false);

  const fetchServices = async (token: string) => {
    try {
      const response = await fetch("/api/services", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 401) {
        router.replace("/login");
        return;
      }
      if (!response.ok) throw new Error("Failed to fetch services");
      setServices(await response.json());
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to fetch services");
    } finally {
      setLoading(false);
    }
  };

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
    void fetchServices(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleCreateService = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreating(true);
    setError("");
    const token = localStorage.getItem("obs_token");

    try {
      const response = await fetch("/api/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newService),
      });

      const body = await response.json();
      if (!response.ok) throw new Error(body.message ?? "Failed to create service");

      setNewService({ name: "", description: "" });
      setShowCreate(false);
      if (body.service?.id) {
        router.push(`/services/${body.service.id}`);
        return;
      }

      if (token) await fetchServices(token);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to create service");
    } finally {
      setCreating(false);
    }
  };

  if (!mounted) return null;

  return (
    <AppShell active="/services">
      <AppTopbar
        placeholder="Search services..."
        userInitial={user?.name?.[0]?.toUpperCase() ?? "U"}
      />

      <div className="dashboard-scroll-area">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Services</h1>
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Register services, then open one to generate telemetry and monitor charts.
            </p>
          </div>
          <button
            id="create-service-btn"
            className="form-submit"
            style={{ width: "auto", padding: "10px 20px", display: "flex", alignItems: "center", gap: 8 }}
            onClick={() => setShowCreate((value) => !value)}
            type="button"
          >
            <Plus size={16} /> New Service
          </button>
        </div>

        {showCreate && (
          <div className="card" style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Create New Service</h2>
            <form onSubmit={handleCreateService} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <label className="form-group">
                <span className="form-label">Service Name</span>
                <input
                  className="form-input"
                  placeholder="auth-service-v2"
                  value={newService.name}
                  onChange={(event) => setNewService({ ...newService, name: event.target.value })}
                  required
                />
              </label>
              <label className="form-group">
                <span className="form-label">Description optional</span>
                <input
                  className="form-input"
                  placeholder="Authentication microservice"
                  value={newService.description}
                  onChange={(event) => setNewService({ ...newService, description: event.target.value })}
                />
              </label>
              <div style={{ display: "flex", gap: 12 }}>
                <button type="submit" className="form-submit" style={{ width: "auto", padding: "10px 20px" }} disabled={creating}>
                  {creating ? <Loader2 size={16} className="spin" /> : "Create"}
                </button>
                <button type="button" className="btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {error && <ErrorBanner message={error} />}

        {loading ? (
          <LoadingBlock label="Loading services..." />
        ) : services.length === 0 ? (
          <EmptyState
            icon={<Layers size={48} color="var(--text-muted)" />}
            title="No services yet"
            description="Create your first service to get a serviceId, then generate telemetry from the service detail page."
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {services.map((service) => (
              <button
                key={service.id}
                className="card service-list-item"
                style={{ cursor: "pointer", transition: "all 0.2s", textAlign: "left", color: "inherit" }}
                onClick={() => router.push(`/services/${service.id}`)}
                type="button"
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 8, background: "var(--accent-green-dim)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Activity size={20} color="var(--accent-green)" />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{service.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                        {service.description || "No description"}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)" }}>
                      <CheckCircle2 size={14} color="var(--accent-green)" />
                      Operational
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock size={12} />
                      {service.createdAt ? new Date(service.createdAt).toLocaleDateString() : "-"}
                    </div>
                    <ChevronRight size={16} color="var(--text-muted)" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
