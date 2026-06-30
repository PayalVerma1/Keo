

import { useRouter, usePathname } from "next/navigation";
import { BrainCircuit, FileText, LayoutGrid, Layers, LogOut, Rocket } from "lucide-react";

interface SidebarProps {
  onLogout?: () => void;
  userName?: string;
  activePath?: string;
}

export function Sidebar({ onLogout, userName = "", activePath }: SidebarProps) {
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
      <div className="sidebar-header">Obsidian Labs</div>

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
          <div className="status-dot" />
          Connected
        </div>
        <div className="mb-4 text-xs text-[var(--text-muted)]">
          WebSocket: Live
        </div>

        {userName && (
          <button
            type="button"
            onClick={() => router.push("/profile")}
            className="mb-3 min-h-10 w-full cursor-pointer rounded-md border-0 bg-transparent p-0 text-left text-xs font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-darker)]"
          >
            {userName}
          </button>
        )}

        {onLogout && (
          <button
            id="logout-btn"
            type="button"
            onClick={onLogout}
            className="flex min-h-10 w-full cursor-pointer items-center gap-3 rounded-md border-0 bg-transparent py-2 text-left text-sm text-[var(--accent-red)] transition-colors hover:bg-white/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-darker)]"
          >
            <LogOut size={16} /> Sign Out
          </button>
        )}
      </div>
    </aside>
  );
}
