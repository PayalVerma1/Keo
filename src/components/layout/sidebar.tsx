

import { useRouter, usePathname } from "next/navigation";
import { BrainCircuit, FileText, LayoutGrid, Layers, LogOut, Rocket } from "lucide-react";

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
    { label: "Overview", icon: <LayoutGrid size={18} />, href: "/" },
    { label: "Services", icon: <Layers size={18} />, href: "/services" },
    { label: "Logs", icon: <FileText size={18} />, href: "/logs" },
    { label: "Deployments", icon: <Rocket size={18} />, href: "/deployments" },
    { label: "AI Insights", icon: <BrainCircuit size={18} />, href: "/insights" },
    { label: "Docs", icon: <FileText size={18} />, href: "/docs" },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">Keo</div>

      <nav className="nav-menu">
        {navItems.map((item) => {
          const isActive = currentPath === item.href || (item.href !== "/" && currentPath.startsWith(item.href));

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
        <div className="mb-4 text-xs text-[var(--text-muted)]">
          WebSocket: {socketState === "live" ? "Live" : socketState === "offline" ? "Offline" : "Pending"}
        </div>

        {userName && (
          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="mb-3 min-h-10 w-full cursor-pointer rounded-md border-0 bg-transparent p-0 text-left text-xs font-semibold text-[var(--text-light)] transition-colors hover:text-[var(--accent-green)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-green)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sidebar-bg)]"
          >
            {userName}
          </button>
        )}

        {onLogout && (
          <button
            id="logout-btn"
            type="button"
            onClick={onLogout}
            className="flex min-h-10 w-full cursor-pointer items-center gap-3 rounded-md border-0 bg-transparent py-2 text-left text-sm font-semibold text-[var(--accent-red)] transition-colors hover:bg-[var(--accent-green-dim)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-green)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sidebar-bg)]"
          >
            <LogOut size={16} /> Sign Out
          </button>
        )}
      </div>
    </aside>
  );
}
