
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
  liveLabel = "Live - WebSockets",
}: TopbarProps) {
  const router = useRouter();
  const initial = userName?.trim().charAt(0)?.toUpperCase() ?? "U";

  return (
    <header className="topbar">
      <div className="search-box">
        <Search size={16} className="text-[var(--text-muted)]" aria-hidden="true" />
        <input type="search" placeholder={searchPlaceholder} aria-label="Search telemetry" />
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
        >
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-500 to-blue-500 text-xs font-bold text-white">
            {initial}
          </div>
        </button>
      </div>
    </header>
  );
}
