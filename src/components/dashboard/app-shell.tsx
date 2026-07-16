"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Bell, Search, Settings } from "lucide-react";
import { AppSidebar } from "./navigation";

type ShellProps = {
  active: string;
  children: React.ReactNode;
  userName?: string;
  onLogout?: () => void;
};

export function AppShell({ active, children, userName, onLogout }: ShellProps) {
  return (
    <div className="layout-wrapper">
      <AppSidebar active={active} userName={userName} onLogout={onLogout} />
      <main className="main-content">{children}</main>
    </div>
  );
}

type CompactShellProps = {
  active: string;
  children: React.ReactNode;
};

export function CompactShell({ active, children }: CompactShellProps) {
  return (
    <div className="compact-layout">
      <AppSidebar active={active} variant="compact" />
      <div className="compact-main">{children}</div>
    </div>
  );
}

type TopbarProps = {
  placeholder: string;
  search?: string;
  onSearch?: (value: string) => void;
  userInitial?: string;
  liveText?: string;
};

export function AppTopbar({
  placeholder,
  search,
  onSearch,
  userInitial = "U",
  liveText = "Live",
}: TopbarProps) {
  return (
    <header className="topbar">
      <div className="search-box">
        <Search size={16} color="var(--text-muted)" />
        <input
          type="text"
          placeholder={placeholder}
          value={search}
          onChange={(event) => onSearch?.(event.target.value)}
        />
      </div>
      <div className="topbar-actions">
        <div className="live-badge">
          <div className="status-dot" />
          {liveText}
        </div>
        <button className="icon-btn" type="button" aria-label="Notifications">
          <Bell size={18} />
        </button>
        <button className="icon-btn" type="button" aria-label="Settings">
          <Settings size={18} />
        </button>
        <Avatar initial={userInitial} />
      </div>
    </header>
  );
}

export function CompactTopbar({
  placeholder,
  search,
  onSearch,
  rightLabel,
}: TopbarProps & { rightLabel?: string }) {
  const router = useRouter();

  return (
    <header className="compact-topbar">
      <div className="compact-search">
        <Search size={14} color="rgba(255,255,255,0.3)" />
        <input
          value={search}
          onChange={(event) => onSearch?.(event.target.value)}
          placeholder={placeholder}
        />
      </div>
      <div style={{ flex: 1 }} />
      {rightLabel && <span className="compact-user-label">{rightLabel}</span>}
      <button className="compact-icon-button" type="button" aria-label="Notifications">
        <Bell size={18} />
      </button>
      <button className="compact-icon-button" type="button" aria-label="Settings">
        <Settings size={18} />
      </button>
      <button
        className="compact-avatar"
        type="button"
        aria-label="Open profile"
        onClick={() => router.push("/profile")}
      />
    </header>
  );
}

function Avatar({ initial }: { initial: string }) {
  return (
    <div className="avatar">
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#A8B5C8",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "12px",
          fontWeight: 700,
          color: "#13141a",
        }}
      >
        {initial}
      </div>
    </div>
  );
}
