"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

export interface StreamEntry {
  id: string;
  time: string;
  level: string;
  message: string;
  serviceId?: string;
  serviceName?: string;
}

const LEVEL_COLOR: Record<string, string> = {
  error: "#ef4444",
  warn:  "#f59e0b",
  info:  "#60a5fa",
  debug: "#a78bfa",
};

const LEVEL_LABEL: Record<string, string> = {
  error: "ERR ",
  warn:  "WARN",
  info:  "INFO",
  debug: "DBG ",
};

function formatStreamTime(date: string) {
  const d = new Date(date);
  const p = (n: number, l = 2) => String(n).padStart(l, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

interface LiveStreamProps {
  /** Initial entries fetched from the server */
  entries: StreamEntry[];
  /** Called when the user clicks "Live" toggle – parent decides whether to poll */
  isLive?: boolean;
  maxRows?: number;
  height?: number | string;
  showServiceName?: boolean;
}

/**
 * LiveStream — terminal-style log viewer that auto-scrolls and highlights by
 * log level.  New entries are prepended (most recent first) when live.
 */
export function LiveStream({
  entries,
  isLive = true,
  maxRows = 200,
  height = 200,
  showServiceName = false,
}: LiveStreamProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever new entries arrive in live mode
  useEffect(() => {
    if (isLive) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [entries, isLive]);

  const visible = entries.slice(0, maxRows);

  return (
    <div
      style={{
        background: "#080a0e",
        borderRadius: 6,
        padding: "10px 14px",
        fontFamily: "monospace",
        fontSize: 12,
        lineHeight: 1.7,
        height,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column-reverse",
      }}
    >
      {/* anchor for scroll-to-bottom */}
      <div ref={bottomRef} />
      {visible.map((entry) => (
        <div
          key={entry.id}
          style={{ display: "flex", alignItems: "baseline", gap: 8, padding: "1px 0" }}
        >
          <span style={{ color: "rgba(255,255,255,0.25)", flexShrink: 0 }}>
            {formatStreamTime(entry.time)}
          </span>
          <span
            style={{
              color: LEVEL_COLOR[entry.level] ?? "#60a5fa",
              fontWeight: 700,
              flexShrink: 0,
              minWidth: 36,
            }}
          >
            [{LEVEL_LABEL[entry.level] ?? entry.level.toUpperCase().slice(0, 4)}]
          </span>
          {showServiceName && entry.serviceName && (
            <span style={{ color: "rgba(255,255,255,0.35)", flexShrink: 0 }}>
              {entry.serviceName}
            </span>
          )}
          <span
            style={{
              color:
                entry.level === "error"
                  ? "#fca5a5"
                  : entry.level === "warn"
                  ? "#fde68a"
                  : "rgba(255,255,255,0.7)",
              wordBreak: "break-word",
            }}
          >
            {entry.message}
          </span>
        </div>
      ))}
      {visible.length === 0 && (
        <div style={{ color: "rgba(255,255,255,0.2)", textAlign: "center", paddingTop: 20 }}>
          No stream events yet
        </div>
      )}
    </div>
  );
}

// ── LiveStreamCard — card wrapper with header + pulse dot ─────────────────────
interface LiveStreamCardProps extends LiveStreamProps {
  title?: string;
}

export function LiveStreamCard({
  title = "Live Stream",
  isLive = true,
  ...rest
}: LiveStreamCardProps) {
  return (
    <div
      style={{
        background: "#111218",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 10,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 18px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: isLive ? "#2ee59d" : "rgba(255,255,255,0.2)",
            boxShadow: isLive ? "0 0 6px #2ee59d" : "none",
            animation: isLive ? "pulse-dot 2s ease-in-out infinite" : "none",
          }}
        />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: "rgba(255,255,255,0.5)",
          }}
        >
          {title}
        </span>
        {isLive && (
          <span
            style={{
              marginLeft: "auto",
              fontSize: 10,
              fontWeight: 700,
              color: "#2ee59d",
              letterSpacing: "0.5px",
            }}
          >
            ● STREAMING
          </span>
        )}
      </div>
      <div style={{ padding: "12px 16px" }}>
        <LiveStream {...rest} isLive={isLive} />
      </div>
    </div>
  );
}

// ── useLiveEntries — hook that polls and keeps a capped rolling buffer ────────
export function useLiveEntries({
  fetchEntries,
  intervalMs = 5000,
  maxEntries = 200,
}: {
  fetchEntries: () => Promise<StreamEntry[]>;
  intervalMs?: number;
  maxEntries?: number;
}) {
  const [entries, setEntries] = useState<StreamEntry[]>([]);
  const [isLive, setIsLive] = useState(true);
  const seenIds = useRef<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    try {
      const fresh = await fetchEntries();
      const newOnes = fresh.filter((e) => !seenIds.current.has(e.id));
      if (newOnes.length > 0) {
        newOnes.forEach((e) => seenIds.current.add(e.id));
        setEntries((prev) => [...newOnes, ...prev].slice(0, maxEntries));
      }
    } catch {
      // silently ignore poll errors
    }
  }, [fetchEntries, maxEntries]);

  useEffect(() => {
    void refresh();
    if (isLive) {
      timerRef.current = setInterval(refresh, intervalMs);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isLive, refresh, intervalMs]);

  return { entries, isLive, setIsLive };
}
