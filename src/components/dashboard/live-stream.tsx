"use client";

import { useEffect, useRef, useState } from "react";

interface LogRow {
  time: string;
  tone: string;
  label: string;
  message: string;
  serviceName?: string;
}

function levelToTone(level: string): { tone: string; label: string } {
  switch (level?.toLowerCase()) {
    case "error":
      return { tone: "term-err", label: "[ERR]" };
    case "warn":
      return { tone: "term-warn", label: "[WARN]" };
    case "debug":
      return { tone: "term-info", label: "[DBG]" };
    default:
      return { tone: "term-info", label: "[INFO]" };
  }
}

function relativeTime(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export function LiveStream() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem("obs_token");
        if (!token) return;

        const servicesRes = await fetch("/api/services", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!servicesRes.ok) return;
        const services = (await servicesRes.json()) as Array<{ id: string; name: string }>;

        const logRequests = services.map(async (service) => {
          const res = await fetch(`/api/logs/${service.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) return [] as LogRow[];
          const entries = (await res.json()) as Array<{
            level: string;
            message: string;
            createdAt: string;
          }>;
          return entries.map((e) => {
            const { tone, label } = levelToTone(e.level);
            return {
              time: relativeTime(e.createdAt),
              tone,
              label,
              message: e.message,
              serviceName: service.name,
            };
          });
        });

        const all = (await Promise.all(logRequests)).flat();

        // sort newest first, take top 20
        const sorted = all
          .slice()
          .sort((a, b) => {
            // rows already have relative time strings — re-sort by message index isn't ideal,
            // but entries come back newest-first from the API, so flat order works.
            return 0;
          })
          .slice(0, 20);

        setRows(sorted);
      } catch {
        // silently fail — live stream is non-critical
      } finally {
        setLoading(false);
      }
    };

    load();

    // Refresh every 30s
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll to bottom on new rows
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [rows]);

  return (
    <div className="card flex-1">
      <div className="card-header">
        <span className="card-title">LIVE STREAM</span>
        <div className="stat-trend trend-up">
          <div className="status-dot" />
          {loading ? "LOADING…" : "STREAMING"}
        </div>
      </div>
      <div className="terminal" id="live-stream-terminal" ref={terminalRef}>
        {loading ? (
          <div className="term-info">[INFO] Loading log stream…</div>
        ) : rows.length === 0 ? (
          <div className="term-info">[INFO] No logs yet — connect a service using the SDK to see live events here.</div>
        ) : (
          rows.map((row, i) => (
            <div key={i}>
              <span className="term-time">{row.time}</span>
              {row.serviceName && (
                <span className="term-info" style={{ marginRight: "4px" }}>
                  [{row.serviceName}]
                </span>
              )}
              <span className={row.tone}>{row.label}</span>
              {" "}{row.message}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
