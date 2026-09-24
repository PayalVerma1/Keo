

"use client";

import { useRouter, usePathname } from "next/navigation";
import { Activity, BookOpen, GitPullRequest, Layers, LogOut } from "lucide-react";

interface SidebarProps {
  onLogout?: () => void;
  userName?: string;
  activePath?: string;
  socketState?: "live" | "connecting" | "offline";
}

export function Sidebar({ onLogout, userName = "", activePath, socketState }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentPath = activePath ?? pathname ?? "/";

  const navItems = [
    { label: "Fingerprint", icon: <Activity size={18} />, href: "/" },
    { label: "GitHub checks", icon: <GitPullRequest size={18} />, href: "/prs" },
    { label: "Applications", icon: <Layers size={18} />, href: "/services" },
    { label: "Docs", icon: <BookOpen size={18} />, href: "/docs" },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">Keo</div>

      <nav className="nav-menu">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? currentPath === "/"
              : currentPath === item.href || currentPath.startsWith(`${item.href}/`);

          return (
            <a
              key={item.href}
              href={item.href}
              id={`nav-${item.label.toLowerCase().replace(" ", "-")}`}
              className={`nav-item${isActive ? " active" : ""}`}
              aria-current={isActive ? "page" : undefined}
              onClick={(e) => {
                e.preventDefault();
                router.push(item.href);
              }}
              >
              {item.icon} {item.label}
            </a>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="status-indicator">
          <div
            className="status-dot"
            style={{
              background:
                socketState === "live"
                  ? "var(--accent-green)"
                  : socketState === "offline"
                  ? "var(--accent-red)"
                  : "var(--accent-yellow)",
            }}
          />
          {socketState === "live" ? "Connected" : socketState === "offline" ? "Disconnected" : "Connecting…"}
        </div>
        <div className="mb-4 text-xs text-[var(--text-secondary)]">
          Pipeline: {socketState === "live" ? "Live" : socketState === "offline" ? "Offline" : "Pending"}
        </div>

        {userName && (
          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="mb-3 min-h-10 w-full cursor-pointer rounded-md border-0 bg-transparent p-0 text-left text-xs font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-darker)]"
          >
            {userName}
          </button>
        )}

        {onLogout && (
          <button
            id="logout-btn"
            type="button"
            onClick={onLogout}
            className="flex min-h-10 w-full cursor-pointer items-center gap-3 rounded-md border-0 bg-transparent py-2 text-left text-sm text-[var(--accent-red)] transition-colors hover:bg-[var(--hover-fill)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-darker)]"
          >
            <LogOut size={16} /> Sign Out
          </button>
        )}
      </div>
    </aside>
  );
}
