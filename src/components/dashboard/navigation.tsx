"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  BrainCircuit,
  FileText,
  LayoutGrid,
  Layers,
  LogOut,
  Rocket,
  User,
} from "lucide-react";

export const navItems = [
  { label: "Overview",    icon: LayoutGrid,  href: "/" },
  { label: "Services",    icon: Layers,       href: "/services" },
  { label: "Logs",        icon: FileText,     href: "/logs" },
  { label: "Deployments", icon: Rocket,       href: "/deployments" },
  { label: "AI Insights", icon: BrainCircuit, href: "/insights" },
  { label: "Profile",     icon: User,         href: "/profile" },
];

type SidebarProps = {
  active: string;
  userName?: string;
  onLogout?: () => void;
  variant?: "default" | "compact";
};

export function AppSidebar({
  active,
  userName = "",
  onLogout,
  variant = "default",
}: SidebarProps) {
  const router = useRouter();

  if (variant === "compact") {
    return (
      <aside className="compact-sidebar">
        <div className="compact-sidebar-brand">Obsidian Labs</div>
        <div className="compact-sidebar-status">
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div className="compact-status-dot" />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#2ee59d" }}>Connected</span>
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
            WebSocket: Live
          </div>
        </div>

        <nav style={{ flex: 1 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={(event) => {
                  event.preventDefault();
                  router.push(item.href);
                }}
                className={`compact-nav-item${isActive ? " active" : ""}`}
              >
                <Icon size={14} />
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="compact-sidebar-footer">
          <a
            href="/docs"
            onClick={(event) => {
              event.preventDefault();
              router.push("/docs");
            }}
            className="compact-footer-link"
          >
            <FileText size={13} />
            Docs
          </a>
          <a href="#" className="compact-footer-link">
            <FileText size={13} />
            Support
          </a>
        </div>
      </aside>
    );
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">Obsidian Labs</div>
      <nav className="nav-menu">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.href}
              href={item.href}
              id={`nav-${item.label.toLowerCase().replace(" ", "-")}`}
              className={`nav-item${active === item.href ? " active" : ""}`}
              onClick={(event) => {
                event.preventDefault();
                router.push(item.href);
              }}
            >
              <Icon size={18} />
              {item.label}
            </a>
          );
        })}
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
          <a
            href="/profile"
            className="nav-item"
            style={{ padding: "8px 0" }}
            onClick={(event) => {
              event.preventDefault();
              router.push("/profile");
            }}
          >
            <User size={16} />
            {userName}
          </a>
        )}

        {onLogout && (
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
            type="button"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        )}

        <a
          href="/docs"
          className="nav-item"
          style={{ padding: "8px 0", marginTop: "8px" }}
          onClick={(event) => {
            event.preventDefault();
            router.push("/docs");
          }}
        >
          <BookOpen size={18} />
          Docs
        </a>
      </div>
    </aside>
  );
}
