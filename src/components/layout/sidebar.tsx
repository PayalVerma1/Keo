

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
        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "16px" }}>
          WebSocket: Live
        </div>

        {userName && (
          <button
            type="button"
            onClick={() => router.push("/profile")}
            style={{
              fontSize: "12px",
              color: "var(--text-secondary)",
              marginBottom: "12px",
              fontWeight: 500,
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            👤 {userName}
          </button>
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
          >
            <LogOut size={16} /> Sign Out
          </button>
        )}
      </div>
    </aside>
  );
}
