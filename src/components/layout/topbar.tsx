"use client";

import { useRouter } from "next/navigation";
import { Bell, Search, Settings } from "lucide-react";

interface TopbarProps {
  userName?: string | null;
  searchPlaceholder?: string;
  liveLabel?: string;
}

export function Topbar({
  userName,
  searchPlaceholder = "Search telemetry...",
  liveLabel = "Live – auto-refresh 30s",
}: TopbarProps) {
  const router = useRouter();
  const initial = userName?.trim().charAt(0)?.toUpperCase() ?? "U";

  return (
    <header className="topbar">
      <div className="search-box">
        <Search size={16} color="var(--text-muted)" />
        <input type="text" placeholder={searchPlaceholder} />
      </div>

      <div className="topbar-actions">
        <div className="live-badge">
          <div className="status-dot" />
          {liveLabel}
        </div>
        <button type="button" className="icon-btn" aria-label="Notifications">
          <Bell size={18} />
        </button>
        <button type="button" className="icon-btn" aria-label="Settings">
          <Settings size={18} />
        </button>
        <button
          type="button"
          className="avatar"
          aria-label="User avatar"
          onClick={() => router.push("/profile")}
          style={{ border: "none", padding: 0, cursor: "pointer" }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "linear-gradient(45deg, #8b5cf6, #3b82f6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: 700,
              color: "white",
            }}
          >
            {initial}
          </div>
        </button>
      </div>
    </header>
  );
}
