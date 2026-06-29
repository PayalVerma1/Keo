"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, Key, Shield, User, Layers as LayersIcon,
  Bell, Settings, CheckCircle2, AlertCircle,
} from "lucide-react";
import { AppShell, AppTopbar } from "@/components/dashboard/app-shell";
import { Toast } from "@/components/dashboard/ui";

interface UserProfile { id: string; name: string; email: string; createdAt: string; }
interface Service     { id: string; name: string; description?: string; createdAt: string; }

// ── Tabs ──────────────────────────────────────────────────────────────────────
type ProfileTab = "general" | "api" | "security";

function ProfileTabs({
  active,
  onChange,
}: {
  active: ProfileTab;
  onChange: (t: ProfileTab) => void;
}) {
  const tabs: { key: ProfileTab; label: string; icon: React.ReactNode }[] = [
    { key: "general",  label: "General",  icon: <User size={14} /> },
    { key: "api",      label: "API Keys", icon: <Key size={14} /> },
    { key: "security", label: "Security", icon: <Shield size={14} /> },
  ];

  return (
    <div
      style={{
        display: "flex",
        gap: 4,
        marginBottom: 20,
        background: "var(--bg-card)",
        borderRadius: 8,
        padding: 4,
        width: "fit-content",
      }}
    >
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            borderRadius: 6,
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 500,
            transition: "all 0.15s",
            background: active === t.key ? "rgba(255,255,255,0.08)" : "transparent",
            color: active === t.key ? "var(--text-primary)" : "var(--text-secondary)",
          }}
        >
          {t.icon} {t.label}
        </button>
      ))}
    </div>
  );
}

// ── GeneralTab ────────────────────────────────────────────────────────────────
function GeneralTab({
  profile,
  services,
  editName,
  saving,
  memberSince,
  onNameChange,
  onSave,
}: {
  profile: UserProfile;
  services: Service[];
  editName: string;
  saving: boolean;
  memberSince: string;
  onNameChange: (v: string) => void;
  onSave: () => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Personal info */}
      <div className="card">
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 20 }}>Personal Information</h2>
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">Display Name</label>
          <input
            className="form-input"
            value={editName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Your display name"
          />
        </div>
        <div className="form-group" style={{ marginBottom: 20 }}>
          <label className="form-label">Email Address</label>
          <input
            className="form-input"
            value={profile.email}
            disabled
            style={{ opacity: 0.5, cursor: "not-allowed" }}
          />
          <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
            Email cannot be changed
          </span>
        </div>
        <button
          className="form-submit"
          style={{ width: "auto", padding: "10px 24px" }}
          onClick={onSave}
          disabled={saving || editName === profile.name}
          type="button"
        >
          {saving ? <Loader2 size={16} className="spin" /> : "Save Changes"}
        </button>
      </div>

      {/* Account stats */}
      <div className="card">
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Account Statistics</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          {[
            { label: "Services Created", value: services.length,                   color: "var(--accent-green)"  },
            { label: "Account ID",        value: `${profile.id.slice(0, 8)}…`,      color: "var(--accent-blue)"   },
            { label: "Member Since",      value: memberSince,                        color: "var(--accent-purple)" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: "rgba(255,255,255,0.03)",
                borderRadius: 8,
                padding: 16,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  marginBottom: 8,
                }}
              >
                {stat.label}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: stat.color }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── ApiKeysTab ────────────────────────────────────────────────────────────────
function ApiKeysTab({
  services,
  apiKeys,
  onGenerate,
  onCopy,
}: {
  services: Service[];
  apiKeys: Record<string, string>;
  onGenerate: (id: string) => void;
  onCopy: (key: string) => void;
}) {
  const router = useRouter();

  return (
    <div className="card">
      <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>API Keys</h2>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 24 }}>
        Generate service-scoped API keys to use with the{" "}
        <code
          style={{
            background: "rgba(255,255,255,0.06)",
            padding: "2px 6px",
            borderRadius: 4,
          }}
        >
          @keo/monitor-sdk
        </code>
        . Each key is tied to a specific service.
      </p>

      {services.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-secondary)" }}>
          <Key size={36} color="var(--text-muted)" style={{ margin: "0 auto 12px" }} />
          <p style={{ marginBottom: 12 }}>No services yet.</p>
          <button
            className="form-submit"
            style={{ width: "auto", padding: "8px 20px" }}
            type="button"
            onClick={() => router.push("/services")}
          >
            Create a Service
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {services.map((svc) => {
            const key = apiKeys[svc.id];
            return (
              <div
                key={svc.id}
                style={{ border: "1px solid var(--border-color)", borderRadius: 8, padding: 16 }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: key ? 12 : 0,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
                      {svc.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-muted)",
                        fontFamily: "monospace",
                      }}
                    >
                      {svc.id}
                    </div>
                  </div>
                  <button
                    className="btn-outline"
                    style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}
                    type="button"
                    onClick={() => onGenerate(svc.id)}
                  >
                    <Key size={13} /> Generate Key
                  </button>
                </div>

                {key && (
                  <div
                    style={{
                      background: "#111216",
                      borderRadius: 6,
                      padding: 12,
                      fontFamily: "monospace",
                      fontSize: 12,
                      color: "var(--accent-green)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <span style={{ wordBreak: "break-all", flex: 1 }}>
                      {key.slice(0, 12)}{"•".repeat(32)}
                    </span>
                    <button
                      className="btn-outline"
                      style={{ fontSize: 11, padding: "4px 10px", flexShrink: 0 }}
                      type="button"
                      onClick={() => onCopy(key)}
                    >
                      Copy
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── SecurityTab ───────────────────────────────────────────────────────────────
function SecurityTab() {
  return (
    <div className="card">
      <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Security</h2>
      <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 24 }}>
        Manage your account security settings.
      </p>
      <div
        style={{
          background: "rgba(245,158,11,0.08)",
          border: "1px solid rgba(245,158,11,0.3)",
          borderRadius: 8,
          padding: "14px 16px",
          fontSize: 13,
          color: "var(--accent-yellow)",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Shield size={16} />
        Password change is coming soon. Contact support to reset your password.
      </div>
      <div className="form-group" style={{ marginBottom: 16, opacity: 0.5 }}>
        <label className="form-label">Current Password</label>
        <input className="form-input" type="password" placeholder="••••••••" disabled />
      </div>
      <div className="form-group" style={{ marginBottom: 16, opacity: 0.5 }}>
        <label className="form-label">New Password</label>
        <input className="form-input" type="password" placeholder="••••••••" disabled />
      </div>
      <div className="form-group" style={{ marginBottom: 20, opacity: 0.5 }}>
        <label className="form-label">Confirm New Password</label>
        <input className="form-input" type="password" placeholder="••••••••" disabled />
      </div>
      <button className="form-submit" style={{ width: "auto", padding: "10px 24px" }} disabled type="button">
        Update Password (Coming Soon)
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const router = useRouter();
  const [mounted, setMounted]     = useState(false);
  const [profile, setProfile]     = useState<UserProfile | null>(null);
  const [services, setServices]   = useState<Service[]>([]);
  const [loading, setLoading]     = useState(true);
  const [editName, setEditName]   = useState("");
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>("general");
  const [apiKeys, setApiKeys]     = useState<Record<string, string>>({});

  const handleLogout = () => {
    localStorage.removeItem("obs_token");
    localStorage.removeItem("obs_user");
    router.replace("/login");
  };

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("obs_token");
    if (!token) { router.replace("/login"); return; }

    Promise.all([
      fetch("/api/auth/me",    { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch("/api/services",   { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    ])
      .then(([prof, svcs]) => {
        setProfile(prof);
        setEditName(prof.name ?? "");
        setServices(Array.isArray(svcs) ? svcs : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const handleSaveName = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    const token = localStorage.getItem("obs_token");
    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: editName }),
      });
      if (!res.ok) throw new Error((await res.json()).message);
      const updated = await res.json();
      setProfile(updated);
      const stored = localStorage.getItem("obs_user");
      if (stored) {
        const u = JSON.parse(stored);
        localStorage.setItem("obs_user", JSON.stringify({ ...u, name: updated.name }));
      }
      setToast({ message: "Name updated successfully!", type: "success" });
    } catch (err: any) {
      setToast({ message: err.message ?? "Failed to update", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const generateApiKey = async (serviceId: string) => {
    const token = localStorage.getItem("obs_token");
    try {
      const res = await fetch(`/api/services/${serviceId}/api-key`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).message ?? "Failed to generate key");
      const data = await res.json();
      setApiKeys((prev) => ({ ...prev, [serviceId]: data.apiKey }));
      setToast({ message: "API key generated! Copy it now — it won't be shown again.", type: "success" });
    } catch (err: any) {
      setToast({ message: err.message, type: "error" });
    }
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setToast({ message: "Copied to clipboard!", type: "success" });
  };

  if (!mounted) return null;

  const userName   = profile?.name ?? "";
  const memberSince = profile
    ? new Date(profile.createdAt).toLocaleDateString([], { year: "numeric", month: "long" })
    : "";

  return (
    <AppShell active="/profile" userName={userName} onLogout={handleLogout}>
      {/* Topbar */}
      <header className="topbar">
        <div style={{ fontSize: 16, fontWeight: 600 }}>Profile</div>
        <div className="topbar-actions">
          <button className="icon-btn" type="button" aria-label="Notifications">
            <Bell size={18} />
          </button>
          <button className="icon-btn" type="button" aria-label="Settings">
            <Settings size={18} />
          </button>
          <div className="avatar">
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "linear-gradient(45deg,#8b5cf6,#3b82f6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 700,
                color: "white",
              }}
            >
              {profile?.name?.[0]?.toUpperCase() ?? "U"}
            </div>
          </div>
        </div>
      </header>

      <div className="dashboard-scroll-area">
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300 }}>
            <Loader2 size={32} className="spin" color="var(--accent-green)" />
          </div>
        ) : profile ? (
          <div style={{ maxWidth: 780 }}>
            {/* Hero */}
            <div
              className="card"
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 24,
                marginBottom: 24,
                padding: 28,
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#8b5cf6,#3b82f6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 28,
                  fontWeight: 700,
                  color: "white",
                  flexShrink: 0,
                }}
              >
                {profile.name?.[0]?.toUpperCase() ?? "U"}
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
                  {profile.name}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8 }}>
                  {profile.email}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Member since {memberSince}
                </div>
              </div>

              {/* Badges */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  alignItems: "flex-end",
                }}
              >
                <div
                  style={{
                    background: "var(--accent-green-dim)",
                    color: "var(--accent-green)",
                    padding: "4px 12px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Active
                </div>
                <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  <LayersIcon size={12} style={{ display: "inline", marginRight: 4 }} />
                  {services.length} service{services.length !== 1 ? "s" : ""}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <ProfileTabs active={activeTab} onChange={setActiveTab} />

            {activeTab === "general" && (
              <GeneralTab
                profile={profile}
                services={services}
                editName={editName}
                saving={saving}
                memberSince={memberSince}
                onNameChange={setEditName}
                onSave={handleSaveName}
              />
            )}
            {activeTab === "api" && (
              <ApiKeysTab
                services={services}
                apiKeys={apiKeys}
                onGenerate={generateApiKey}
                onCopy={copyKey}
              />
            )}
            {activeTab === "security" && <SecurityTab />}
          </div>
        ) : (
          <p style={{ color: "var(--text-secondary)" }}>Could not load profile.</p>
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </AppShell>
  );
}
