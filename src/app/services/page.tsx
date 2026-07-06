"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Layers, Plus, Activity, Clock,
  CheckCircle2, ChevronRight, Loader2
} from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { useSocketState } from "@/lib/useSocketState";
import { Topbar } from "@/components/layout/topbar";

interface Service {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

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

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("obs_token");
    if (!token) {
      router.replace("/login");
      return;
    }
    const storedUser = localStorage.getItem("obs_user");
    if (storedUser) setUser(JSON.parse(storedUser));
    fetchServices(token);
  }, [router]);

  const fetchServices = async (token: string) => {
    try {
      const res = await fetch("/api/services", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch services");
      const data = await res.json();
      setServices(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const token = localStorage.getItem("obs_token");
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newService),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message);
      }
      const data = await res.json();
      setNewService({ name: "", description: "" });
      setShowCreate(false);
      if (data.service?.id) {
        router.push(`/services/${data.service.id}`);
        return;
      }
      fetchServices(token!);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("obs_token");
    localStorage.removeItem("obs_user");
    router.replace("/login");
  };

  const socketState = useSocketState();

  if (!mounted) return null;

  return (
    <div className="layout-wrapper">
      <Sidebar activePath="/services" onLogout={handleLogout} userName={user?.name ?? ""} socketState={socketState} />
      <main className="main-content">
        <Topbar userName={user?.name} />

        <div className="dashboard-scroll-area">
          {/* Page header */}
          <div className="page-hero">
            <div className="page-title-wrap">
              <h1 className="page-title">Services</h1>
              <p className="page-subtitle">
                Manage and monitor your infrastructure services with the same polished control plane experience as the dashboard.
              </p>
            </div>
            <div className="page-actions">
              <button
                id="create-service-btn"
                className="form-submit sm:w-auto sm:px-5 sm:py-2.5"
                onClick={() => setShowCreate((v) => !v)}
              >
                <Plus size={16} /> New Service
              </button>
            </div>
          </div>

          {/* Create form */}
          {showCreate && (
            <div className="card" style={{ marginBottom:"24px" }}>
              <h2 style={{ fontSize:"16px", fontWeight:600, marginBottom:"16px" }}>Create New Service</h2>
              <form onSubmit={handleCreateService} style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
                <div className="form-group">
                  <label className="form-label">Service Name</label>
                  <input
                    className="form-input"
                    placeholder="auth-service-v2"
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description (optional)</label>
                  <input
                    className="form-input"
                    placeholder="Authentication microservice"
                    value={newService.description}
                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  />
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button type="submit" className="form-submit sm:w-auto sm:px-5 sm:py-2.5" disabled={creating}>
                    {creating ? <Loader2 size={16} className="spin" /> : "Create"}
                  </button>
                  <button type="button" className="btn-outline" onClick={() => setShowCreate(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {error && <div className="form-error" style={{ marginBottom:"24px" }}>{error}</div>}

          {loading ? (
            <div style={{ display:"flex", justifyContent:"center", alignItems:"center", height:"200px" }}>
              <Loader2 size={32} className="spin" color="var(--accent-green)" />
            </div>
          ) : services.length === 0 ? (
            <div className="card" style={{ textAlign:"center", padding:"56px 20px" }}>
              <Layers size={48} color="var(--text-muted)" style={{ margin:"0 auto 16px" }} />
              <p style={{ fontSize:"16px", fontWeight:600, marginBottom:"8px" }}>No services yet</p>
              <p style={{ fontSize:"13px", color:"var(--text-secondary)" }}>
                Create your first service to start monitoring metrics.
              </p>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
              {services.map((service) => (
                <div
                  key={service.id}
                  className="card service-list-item"
                  style={{ cursor:"pointer", transition:"all 0.2s" }}
                  onClick={() => router.push(`/services/${service.id}`)}
                >
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"16px" }}>
                      <div style={{ width:"40px", height:"40px", borderRadius:"8px", background:"var(--accent-green-dim)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <Activity size={20} color="var(--accent-green)" />
                      </div>
                      <div>
                        <div style={{ fontSize:"15px", fontWeight:600, marginBottom:"4px" }}>{service.name}</div>
                        <div style={{ fontSize:"12px", color:"var(--text-secondary)" }}>
                          {service.description || "No description"}
                        </div>
                      </div>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:"24px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"6px", fontSize:"12px", color:"var(--text-secondary)" }}>
                        <CheckCircle2 size={14} color="var(--accent-green)" />
                        Operational
                      </div>
                      <div style={{ fontSize:"11px", color:"var(--text-muted)", display:"flex", alignItems:"center", gap:"4px" }}>
                        <Clock size={12} />
                        {new Date(service.createdAt).toLocaleDateString()}
                      </div>
                      <ChevronRight size={16} color="var(--text-muted)" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
