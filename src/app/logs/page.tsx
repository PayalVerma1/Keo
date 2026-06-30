"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Download,
  FileText,
  Info,
  Search,
  X,
} from "lucide-react";
import { CompactShell, CompactTopbar } from "@/components/dashboard/app-shell";
import type { LogEntry, Service } from "@/components/dashboard/types";
import { formatLogTimestamp, serviceColor } from "@/components/dashboard/utils";
import { EmptyState, LoadingSpinner, type BadgeVariant } from "@/components/dashboard/ui";
import { LiveStreamCard, useLiveEntries, type StreamEntry } from "@/components/dashboard/live-stream";

// ── Level config ──────────────────────────────────────────────────────────────
const LEVEL_CONFIG: Record<
  string,
  { bg: string; color: string; border: string; icon: React.ReactNode }
> = {
  error: {
    bg: "rgba(239,68,68,0.15)",
    color: "#ef4444",
    border: "1px solid rgba(239,68,68,0.4)",
    icon: <AlertCircle size={11} />,
  },
  warn: {
    bg: "rgba(245,158,11,0.1)",
    color: "#f59e0b",
    border: "1px solid rgba(245,158,11,0.4)",
    icon: <AlertTriangle size={11} />,
  },
  info: {
    bg: "transparent",
    color: "#60a5fa",
    border: "1px solid rgba(96,165,250,0.35)",
    icon: <Info size={11} />,
  },
  debug: {
    bg: "transparent",
    color: "#a78bfa",
    border: "1px solid rgba(167,139,250,0.3)",
    icon: <Info size={11} />,
  },
};

// ── Filter tabs ───────────────────────────────────────────────────────────────
type LogTab = "all" | "error" | "warn" | "info";

function FilterTabs({
  tab,
  setTab,
  logs,
}: {
  tab: LogTab;
  setTab: (t: LogTab) => void;
  logs: LogEntry[];
}) {
  const counts = {
    error: logs.filter((l) => l.level === "error").length,
    warn:  logs.filter((l) => l.level === "warn").length,
    info:  logs.filter((l) => ["info", "debug"].includes(l.level)).length,
  };

  return (
    <div
      style={{
        display: "flex",
        background: "rgba(255,255,255,0.04)",
        borderRadius: 6,
        padding: 3,
        gap: 2,
      }}
    >
      {(
        [
          ["all",   "All"],
          ["error", `Errors${counts.error > 0 ? ` (${counts.error})` : ""}`],
          ["warn",  `Warnings${counts.warn > 0 ? ` (${counts.warn})` : ""}`],
          ["info",  `Info${counts.info > 0 ? ` (${counts.info})` : ""}`],
        ] as Array<[LogTab, string]>
      ).map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => setTab(key)}
          style={{
            padding: "5px 12px",
            borderRadius: 4,
            border: "none",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 500,
            background: tab === key ? "rgba(255,255,255,0.1)" : "transparent",
            color: tab === key ? "#fff" : "rgba(255,255,255,0.45)",
            transition: "all 0.15s",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ── Log row ───────────────────────────────────────────────────────────────────
function LogRow({
  log,
  index,
  serviceName,
  selected,
  onSelect,
}: {
  log: LogEntry;
  index: number;
  serviceName: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const cfg = LEVEL_CONFIG[log.level] ?? LEVEL_CONFIG.info;
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        display: "grid",
        gridTemplateColumns: "120px 200px 180px 1fr",
        width: "100%",
        padding: "9px 20px",
        border: "none",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        cursor: "pointer",
        background: selected
          ? "rgba(255,255,255,0.04)"
          : index % 2 === 0
          ? "transparent"
          : "rgba(255,255,255,0.01)",
        transition: "background 0.1s",
        textAlign: "left",
      }}
    >
      <div>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "2px 8px",
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 700,
            background: cfg.bg,
            color: cfg.color,
            border: cfg.border,
          }}
        >
          {cfg.icon}
          {log.level.toUpperCase()}
        </span>
      </div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontFamily: "monospace" }}>
        {formatLogTimestamp(log.createdAt)}
      </div>
      <div style={{ fontSize: 12, fontFamily: "monospace", color: serviceColor(serviceName), fontWeight: 500 }}>
        {serviceName}
      </div>
      <div
        style={{
          fontSize: 12,
          color: "rgba(255,255,255,0.75)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {log.message}
      </div>
    </button>
  );
}

// ── Detail panel ──────────────────────────────────────────────────────────────
function DetailPanel({
  log,
  serviceName,
  onClose,
}: {
  log: LogEntry;
  serviceName: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const cfg = LEVEL_CONFIG[log.level] ?? LEVEL_CONFIG.info;

  const copyDetails = () => {
    navigator.clipboard.writeText(
      `@timestamp: ${new Date(log.createdAt).toISOString()}\nservice.name: ${serviceName}\nlog.level: ${log.level.toUpperCase()}\nmessage: ${log.message}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        borderTop: "1px solid rgba(255,255,255,0.1)",
        background: "#0a0b0f",
        flexShrink: 0,
        maxHeight: 280,
        overflow: "auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          position: "sticky",
          top: 0,
          background: "#0a0b0f",
        }}
      >
        <FileText size={13} color="rgba(255,255,255,0.4)" />
        <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)" }}>
          Log Entry Details
        </span>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          aria-label="Copy log details"
          onClick={copyDetails}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "rgba(255,255,255,0.4)",
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 11,
          }}
        >
          {copied ? <CheckCircle2 size={13} color="#2ee59d" /> : <Copy size={13} />}
        </button>
        <button
          type="button"
          aria-label="Close details"
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "rgba(255,255,255,0.4)",
            display: "flex",
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: "16px 20px", fontFamily: "monospace", fontSize: 13, lineHeight: 1.8 }}>
        <div>
          <span style={{ color: "rgba(255,255,255,0.4)" }}>@timestamp: </span>
          <span style={{ color: "#2ee59d" }}>{new Date(log.createdAt).toISOString()}</span>
        </div>
        <div>
          <span style={{ color: "rgba(255,255,255,0.4)" }}>service.name: </span>
          <span style={{ color: "#2ee59d" }}>{serviceName}</span>
        </div>
        <div>
          <span style={{ color: "rgba(255,255,255,0.4)" }}>log.level: </span>
          <span style={{ color: cfg.color, fontWeight: 700 }}>{log.level.toUpperCase()}</span>
        </div>
        <div>
          <span style={{ color: "rgba(255,255,255,0.4)" }}>service.id: </span>
          <span style={{ color: "#60a5fa" }}>{log.serviceId}</span>
        </div>
        <div
          style={{
            marginTop: 12,
            padding: "12px 16px",
            background:
              log.level === "error" ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.04)",
            borderRadius: 6,
            border: `1px solid ${
              log.level === "error" ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.08)"
            }`,
            color: log.level === "error" ? "#fca5a5" : "rgba(255,255,255,0.7)",
          }}
        >
          {log.message}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LogsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<LogTab>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<LogEntry | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tokenRef = useRef<string | null>(null);

  const fetchLogs = useCallback(
    async (token: string) => {
      try {
        const svcRes = await fetch("/api/services", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (svcRes.status === 401) {
          router.replace("/login");
          return;
        }
        const svcs = (await svcRes.json()) as Service[];
        setServices(svcs);

        const groups = await Promise.all(
          svcs.map((svc) =>
            fetch(`/api/logs/${svc.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
              .then((r) => (r.ok ? r.json() : []))
              .catch(() => [])
          )
        );
        setLogs(
          (groups.flat() as LogEntry[]).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("obs_token");
    if (!token) {
      router.replace("/login");
      return;
    }
    tokenRef.current = token;
    void fetchLogs(token);
    timerRef.current = setInterval(() => {
      const t = localStorage.getItem("obs_token");
      if (t) void fetchLogs(t);
    }, 10_000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchLogs, router]);

  // ── Live stream ─────────────────────────────────────────────────────────
  const fetchStreamEntries = useCallback(async (): Promise<StreamEntry[]> => {
    const token = tokenRef.current;
    if (!token) return [];
    try {
      // fetch fresh batch of all logs across all services
      const svcs = services.length > 0 ? services : [];
      const groups = await Promise.all(
        svcs.map((svc) =>
          fetch(`/api/logs/${svc.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((r) => (r.ok ? r.json() : []))
            .catch(() => [])
        )
      );
      return (groups.flat() as LogEntry[])
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 40)
        .map((l) => ({
          id: l.id ?? `${l.createdAt}-${l.message}`,
          time: l.createdAt,
          level: l.level,
          message: l.message,
          serviceId: l.serviceId,
          serviceName:
            services.find((s) => s.id === l.serviceId)?.name ?? l.serviceId,
        }));
    } catch {
      return [];
    }
  }, [services]);

  const { entries: streamEntries, isLive } = useLiveEntries({
    fetchEntries: fetchStreamEntries,
    intervalMs: 6000,
  });

  // ── Derived ─────────────────────────────────────────────────────────────
  const filtered = logs.filter((l) => {
    if (tab === "error" && l.level !== "error") return false;
    if (tab === "warn" && l.level !== "warn") return false;
    if (tab === "info" && !["info", "debug"].includes(l.level)) return false;
    if (search && !l.message.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const exportLogs = () => {
    const content = filtered
      .map((l) => `[${formatLogTimestamp(l.createdAt)}] [${l.level.toUpperCase()}] ${l.message}`)
      .join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
    a.download = "logs.txt";
    a.click();
  };

  if (!mounted) return null;

  return (
    <CompactShell active="/logs">
      <CompactTopbar placeholder="Global Search..." search={search} onSearch={setSearch} />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left: log table */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Toolbar */}
          <div
            style={{
              padding: "14px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
              flexShrink: 0,
              background: "#111218",
            }}
          >
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>System Logs</div>
            </div>
            <div
              style={{
                background: "rgba(255,255,255,0.08)",
                borderRadius: 4,
                padding: "3px 8px",
                fontSize: 12,
                color: "rgba(255,255,255,0.6)",
              }}
            >
              {logs.length.toLocaleString()} Events
            </div>
            <div style={{ flex: 1 }} />
            <FilterTabs tab={tab} setTab={setTab} logs={logs} />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(255,255,255,0.05)",
                borderRadius: 6,
                padding: "6px 12px",
              }}
            >
              <Search size={13} color="rgba(255,255,255,0.3)" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter messages..."
                style={{
                  background: "none",
                  border: "none",
                  outline: "none",
                  color: "#fff",
                  fontSize: 12,
                  width: 160,
                }}
              />
            </div>
            <button
              type="button"
              aria-label="Export logs"
              onClick={exportLogs}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 6,
                padding: "6px 10px",
                cursor: "pointer",
                color: "rgba(255,255,255,0.7)",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Download size={14} />
            </button>
          </div>

          {/* Column headers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "120px 200px 180px 1fr",
              padding: "8px 20px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              position: "sticky",
              top: 0,
              background: "#111218",
              zIndex: 10,
              flexShrink: 0,
            }}
          >
            {["Level", "Timestamp", "Service", "Message"].map((h) => (
              <span
                key={h}
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.35)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          <div style={{ flex: 1, overflow: "auto" }}>
            {loading ? (
              <LoadingSpinner label="Loading logs..." />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={<FileText size={40} />}
                title="No logs match the current filters"
              />
            ) : (
              filtered.map((log, idx) => (
                <LogRow
                  key={log.id ?? idx}
                  log={log}
                  index={idx}
                  serviceName={
                    services.find((s) => s.id === log.serviceId)?.name ?? log.serviceId
                  }
                  selected={selected?.id === log.id}
                  onSelect={() => setSelected(selected?.id === log.id ? null : log)}
                />
              ))
            )}
          </div>

          {/* Detail panel */}
          {selected && (
            <DetailPanel
              log={selected}
              serviceName={services.find((s) => s.id === selected.serviceId)?.name ?? selected.serviceId}
              onClose={() => setSelected(null)}
            />
          )}
        </div>

        {/* Right: live stream panel */}
        <div
          style={{
            width: 320,
            flexShrink: 0,
            borderLeft: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: "#0d0e12",
          }}
        >
          <div style={{ padding: 16, flex: 1, overflow: "hidden" }}>
            <LiveStreamCard
              title="Live Stream"
              entries={streamEntries}
              isLive={isLive}
              height="calc(100vh - 120px)"
              showServiceName
            />
          </div>
        </div>
      </div>
    </CompactShell>
  );
}
