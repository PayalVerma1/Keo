"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing, CheckCircle2, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name?: string; email?: string; createdAt?: string } | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("obs_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    // Always fetch fresh from API so profile data is never stale
    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          localStorage.removeItem("obs_token");
          localStorage.removeItem("obs_user");
          router.replace("/login");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data) setUser(data);
      })
      .catch(() => {
        // fallback to localStorage
        const storedUser = localStorage.getItem("obs_user");
        if (storedUser) {
          try { setUser(JSON.parse(storedUser)); } catch {}
        }
      })
      .finally(() => setLoadingUser(false));
  }, [router]);
  const handleLogout = () => {
    localStorage.removeItem("obs_token");
    localStorage.removeItem("obs_user");
    router.replace("/login");
  };

  const initials = (user?.name ?? "User")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="layout-wrapper">
      <Sidebar activePath="/profile" onLogout={handleLogout} userName={user?.name ?? ""} />
      <main className="main-content">
        <Topbar userName={user?.name} liveLabel="Live – WebSocket" />
        <div className="dashboard-scroll-area">
          <div className="page-hero" style={{ marginBottom: "20px" }}>
            <div className="page-title-wrap">
              <h1 className="page-title">Profile</h1>
              <p className="page-subtitle">Keep your observability workspace aligned with your team and account.</p>
            </div>
          </div>

          <div className="dashboard-grid" style={{ alignItems: "start" }}>
            <div>
              <div className="card" style={{ padding: "24px", marginBottom: "20px" }}>
                <div style={{ display: "flex", gap: "16px", alignItems: "center", marginBottom: "20px" }}>
                  <div
                    style={{
                      width: "64px",
                      height: "64px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "20px",
                      color: "white",
                      background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
                    }}
                  >
                    {initials}
                  </div>
                  <div>
                    <div style={{ fontSize: "22px", fontWeight: 700 }}>{user?.name ?? "Your account"}</div>
                    <div style={{ color: "var(--text-secondary)", marginTop: "4px" }}>{user?.email ?? "no email saved"}</div>
                  </div>
                </div>

                <div style={{ display: "grid", gap: "12px" }}>
                  <div className="card" style={{ padding: "14px 16px" }}>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Account status</div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600 }}>
                      <CheckCircle2 size={16} color="var(--accent-green)" /> Active
                    </div>
                  </div>
                  <div className="card" style={{ padding: "14px 16px" }}>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Member since</div>
                    <div style={{ fontWeight: 600 }}>
                      {loadingUser ? "…" : user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="right-sidebar">
              <div className="card" style={{ marginBottom: "16px" }}>
                <div className="card-header">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <ShieldCheck size={18} color="#a5b4fc" />
                    <span style={{ fontSize: "16px", fontWeight: 600 }}>Security</span>
                  </div>
                </div>
                <div style={{ color: "var(--text-secondary)", lineHeight: 1.6, fontSize: "14px" }}>
                  Two-factor authentication and password updates can be managed from your account security settings.
                </div>
              </div>

              <div className="card" style={{ marginBottom: "16px" }}>
                <div className="card-header">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <BellRing size={18} color="#34d399" />
                    <span style={{ fontSize: "16px", fontWeight: 600 }}>Notifications</span>
                  </div>
                </div>
                <div style={{ color: "var(--text-secondary)", lineHeight: 1.6, fontSize: "14px" }}>
                  Receive alerts for deployments, latency spikes, and critical service events in real time.
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Sparkles size={18} color="#f59e0b" />
                    <span style={{ fontSize: "16px", fontWeight: 600 }}>Quick actions</span>
                  </div>
                </div>
                <div style={{ display: "grid", gap: "10px" }}>
                  <button type="button" className="nav-item" style={{ justifyContent: "flex-start" }} onClick={() => router.push("/services")}>
                    <UserRound size={16} /> View services
                  </button>
                  <button type="button" className="nav-item" style={{ justifyContent: "flex-start" }} onClick={() => router.push("/docs")}>
                    <Sparkles size={16} /> Open docs
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
