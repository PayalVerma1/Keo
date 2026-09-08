
"use client";

import { useRouter } from "next/navigation";
import { Bell, Search, Settings } from "lucide-react";

interface TopbarProps {
  userName?: string | null;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  liveLabel?: string;
}

export function Topbar({
  userName,
  searchPlaceholder = "Search pull requests...",
  searchValue,
  onSearchChange,
  liveLabel = "PR scoring",
}: TopbarProps) {
  const router = useRouter();
  const initial = userName?.trim().charAt(0)?.toUpperCase() ?? "U";

  return (
    <header className="topbar">
      <div className="search-box">
        <Search size={16} className="text-[var(--text-muted)]" aria-hidden="true" />
        <input
          type="search"
          placeholder={searchPlaceholder}
          aria-label="Search pull requests"
          {...(onSearchChange
            ? {
                value: searchValue ?? "",
                onChange: (event: { target: { value: string } }) => onSearchChange(event.target.value),
              }
            : {})}
        />
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
          <div className="flex h-full w-full items-center justify-center bg-[#A8B5C8] text-xs font-bold text-[#13141a]">
            {initial}
          </div>
        </button>
      </div>
    </header>
  );
}
