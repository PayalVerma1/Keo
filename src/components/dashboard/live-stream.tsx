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
        const response = await fetch("/api/logs?limit=20");
        if (!response.ok) return;
        const entries = (await response.json()) as Array<{
          level: string;
          message: string;
          createdAt: string;
          serviceName?: string;
        }>;
        setRows(entries.map((entry) => {
          const { tone, label } = levelToTone(entry.level);
          return { time: relativeTime(entry.createdAt), tone, label, message: entry.message, serviceName: entry.serviceName };
        }));
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
