"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutGrid, Layers, FileText, Rocket, BrainCircuit,
  Bell, Settings, Search, Plus, Activity, Clock,
  CheckCircle2, AlertTriangle, ChevronRight, Loader2
} from "lucide-react";

interface Service {
  id: string;
  name: string;
  description?: string;
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
          <a
            key={item.href}
            href={item.href}
            className={`nav-item${active === item.href ? " active" : ""}`}
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

  if (!mounted) return null;

  return (
    <div className="layout-wrapper">
      <Sidebar active="/services" />
      <main className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div className="search-box">
            <Search size={16} color="var(--text-muted)" />
            <input type="text" placeholder="Search services..." />
          </div>
          <div className="topbar-actions">
            <div className="live-badge">
              <div className="status-dot" />
              Live
            </div>
            <div className="icon-btn"><Bell size={18} /></div>
            <div className="icon-btn"><Settings size={18} /></div>
            <div className="avatar">
              <div style={{ width: "100%", height: "100%", background: "linear-gradient(45deg, #8b5cf6, #3b82f6)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"12px", fontWeight:700, color:"white" }}>
                {user?.name?.[0]?.toUpperCase() ?? "U"}
              </div>
            </div>
          </div>
        </header>

        <div className="dashboard-scroll-area">
          {/* Page header */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"24px" }}>
            <div>
              <h1 style={{ fontSize:"22px", fontWeight:700, marginBottom:"4px" }}>Services</h1>
              <p style={{ fontSize:"13px", color:"var(--text-secondary)" }}>
                Manage and monitor your infrastructure services
              </p>
            </div>
            <button
              id="create-service-btn"
              className="form-submit"
              style={{ width:"auto", padding:"10px 20px", display:"flex", alignItems:"center", gap:"8px" }}
              onClick={() => setShowCreate((v) => !v)}
            >
              <Plus size={16} /> New Service
            </button>
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
                <div style={{ display:"flex", gap:"12px" }}>
                  <button type="submit" className="form-submit" style={{ width:"auto", padding:"10px 20px" }} disabled={creating}>
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
            <div className="card" style={{ textAlign:"center", padding:"60px 20px" }}>
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
