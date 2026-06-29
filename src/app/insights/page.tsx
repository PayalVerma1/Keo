"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BrainCircuit,
  RefreshCw,
  TriangleAlert,
  Zap,
} from "lucide-react";
import { CompactShell, CompactTopbar } from "@/components/dashboard/app-shell";
import type { Insight, Service } from "@/components/dashboard/types";
import { relativeTime, severityBadge, serviceColor } from "@/components/dashboard/utils";
import {
  ActionButton,
  Badge,
  EmptyState,
  LoadingSpinner,
  SectionHeader,
  StatCard,
  type BadgeVariant,
} from "@/components/dashboard/ui";
import { LiveStreamCard, useLiveEntries, type StreamEntry } from "@/components/dashboard/live-stream";

// ── severity → badge variant ──────────────────────────────────────────────────
function severityToBadge(sev: string): BadgeVariant {
  if (sev === "critical") return "critical";
  if (sev === "high") return "high";
  if (sev === "medium") return "medium";
  return "low";
}

// ── Single insight card ───────────────────────────────────────────────────────
function InsightCard({
  insight,
  serviceName,
}: {
  insight: Insight;
  serviceName: string;
}) {
  const sev = insight.severity.toLowerCase() as BadgeVariant;
  const isCritical = sev === "critical" || sev === "high";

  return (
    <div
      style={{
        background: isCritical ? "rgba(239,68,68,0.04)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${isCritical ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 10,
        padding: 20,
        marginBottom: 14,
        transition: "border-color 0.2s",
      }}
    >
      {/* Top row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Badge variant={severityToBadge(insight.severity)}>
            {insight.severity}
          </Badge>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
            {relativeTime(insight.createdAt)}
          </span>
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: serviceColor(serviceName),
            letterSpacing: "0.3px",
          }}
        >
          {serviceName}
        </span>
      </div>

      {/* Root cause */}
      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: "#fff",
          marginBottom: 8,
          lineHeight: 1.4,
        }}
      >
        {insight.rootCause}
      </div>

      {/* Recommendation */}
      <p
        style={{
          fontSize: 13,
          color: "rgba(255,255,255,0.55)",
          lineHeight: 1.6,
          marginBottom: 16,
        }}
      >
        {insight.recommendation}
      </p>

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {isCritical && (
          <ActionButton variant="danger" style={{ fontSize: 12, padding: "5px 12px" }}>
            <Zap size={12} /> Investigate
          </ActionButton>
        )}
        <ActionButton variant="secondary" style={{ fontSize: 12, padding: "5px 12px" }}>
          {isCritical ? "Ignore" : "Mark Resolved"}
        </ActionButton>
      </div>
    </div>
  );
}

// ── Filter tabs ───────────────────────────────────────────────────────────────
type SeverityFilter = "all" | "critical" | "high" | "medium" | "low";

function FilterTabs({
  active,
  counts,
  onChange,
}: {
  active: SeverityFilter;
  counts: Record<SeverityFilter, number>;
  onChange: (v: SeverityFilter) => void;
}) {
  const tabs: { key: SeverityFilter; label: string }[] = [
    { key: "all",      label: `All (${counts.all})` },
    { key: "critical", label: `Critical${counts.critical > 0 ? ` (${counts.critical})` : ""}` },
    { key: "high",     label: `High${counts.high > 0 ? ` (${counts.high})` : ""}` },
    { key: "medium",   label: `Medium${counts.medium > 0 ? ` (${counts.medium})` : ""}` },
    { key: "low",      label: `Low${counts.low > 0 ? ` (${counts.low})` : ""}` },
  ];

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
      {tabs.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          style={{
            padding: "5px 12px",
            borderRadius: 4,
            border: "none",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 500,
            background: active === key ? "rgba(255,255,255,0.1)" : "transparent",
            color: active === key ? "#fff" : "rgba(255,255,255,0.45)",
            transition: "all 0.15s",
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ── Warning Banner ────────────────────────────────────────────────────────────
function WarningBanner({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "rgba(239,68,68,0.08)",
        border: "1px solid rgba(239,68,68,0.3)",
        borderRadius: 8,
        padding: "10px 16px",
        marginBottom: 20,
        fontSize: 13,
        color: "#fca5a5",
      }}
    >
      <TriangleAlert size={16} color="#ef4444" />
      <span>
        <strong style={{ color: "#ef4444" }}>{count} critical alert{count > 1 ? "s" : ""}</strong>{" "}
        require your immediate attention.
      </span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function InsightsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [refreshKey, setRefreshKey] = useState(0);
  const tokenRef = useRef<string | null>(null);

  // ── Fetch insights for all services ──────────────────────────────────────
  const fetchAll = useCallback(async (token: string) => {
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
          fetch(`/api/insights/${svc.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((r) => (r.ok ? r.json() : []))
            .catch(() => [])
        )
      );
      setInsights(
        (groups.flat() as Insight[]).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("obs_token");
    if (!token) {
      router.replace("/login");
      return;
    }
    tokenRef.current = token;
    void fetchAll(token);
  }, [fetchAll, router, refreshKey]);

  // ── Build live-stream entries from insights ───────────────────────────────
  const fetchStreamEntries = useCallback(async (): Promise<StreamEntry[]> => {
    const token = tokenRef.current;
    if (!token || services.length === 0) return [];
    try {
      const groups = await Promise.all(
        services.map((svc) =>
          fetch(`/api/logs/${svc.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((r) => (r.ok ? r.json() : []))
            .catch(() => [])
        )
      );
      return (groups.flat() as Array<{ id: string; createdAt: string; level: string; message: string; serviceId: string }>)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 50)
        .map((l) => ({
          id: l.id ?? `${l.createdAt}-${l.message}`,
          time: l.createdAt,
          level: l.level,
          message: l.message,
          serviceId: l.serviceId,
          serviceName: services.find((s) => s.id === l.serviceId)?.name ?? l.serviceId,
        }));
    } catch {
      return [];
    }
  }, [services]);

  const { entries: streamEntries, isLive } = useLiveEntries({
    fetchEntries: fetchStreamEntries,
    intervalMs: 5000,
  });

  // ── Derived ───────────────────────────────────────────────────────────────
  const filtered = insights.filter((i) => {
    if (severityFilter !== "all" && i.severity !== severityFilter) return false;
    if (
      search &&
      !i.rootCause.toLowerCase().includes(search.toLowerCase()) &&
      !i.recommendation.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const counts: Record<SeverityFilter, number> = {
    all:      insights.length,
    critical: insights.filter((i) => i.severity === "critical").length,
    high:     insights.filter((i) => i.severity === "high").length,
    medium:   insights.filter((i) => i.severity === "medium").length,
    low:      insights.filter((i) => i.severity === "low").length,
  };

  const criticalCount = counts.critical;

  if (!mounted) return null;

  return (
    <CompactShell active="/insights">
      <CompactTopbar placeholder="Search insights..." search={search} onSearch={setSearch} />

      <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
        <SectionHeader
          title="AI Insights"
          description="Gemini-powered anomaly detection across all your services."
        >
          <ActionButton
            variant="secondary"
            onClick={() => {
              setLoading(true);
              setRefreshKey((k) => k + 1);
            }}
          >
            <RefreshCw size={13} /> Refresh
          </ActionButton>
        </SectionHeader>

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <StatCard label="Total Insights" value={insights.length} />
          <StatCard label="Critical" value={counts.critical} color="#ef4444" />
          <StatCard label="High" value={counts.high} color="#f97316" />
          <StatCard label="Low / Medium" value={counts.medium + counts.low} color="#60a5fa" />
        </div>

        {/* Warning banner for critical alerts */}
        <WarningBanner count={criticalCount} />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20 }}>
          {/* Left: insight list */}
          <div>
            {/* Filter row */}
            <div style={{ marginBottom: 16 }}>
              <FilterTabs active={severityFilter} counts={counts} onChange={setSeverityFilter} />
            </div>

            {loading ? (
              <LoadingSpinner label="Fetching AI insights..." />
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={<BrainCircuit size={44} />}
                title="No insights match the current filters"
                description="AI insights are generated automatically when metrics breach thresholds."
              />
            ) : (
              filtered.map((insight, idx) => (
                <InsightCard
                  key={insight.id ?? idx}
                  insight={insight}
                  serviceName={
                    services.find((s) => s.id === insight.serviceId)?.name ?? insight.serviceId
                  }
                />
              ))
            )}
          </div>

          {/* Right: live stream */}
          <div>
            {/* Service summary */}
            <div
              style={{
                background: "#111218",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 10,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  color: "rgba(255,255,255,0.35)",
                  marginBottom: 12,
                }}
              >
                Monitored Services
              </div>
              {services.length === 0 ? (
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>
                  No services registered yet.
                </p>
              ) : (
                services.map((svc) => {
                  const hasIssue = insights.some(
                    (i) =>
                      i.serviceId === svc.id &&
                      ["critical", "high"].includes(i.severity)
                  );
                  return (
                    <div
                      key={svc.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 0",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            background: hasIssue ? "#ef4444" : "#2ee59d",
                            boxShadow: `0 0 5px ${hasIssue ? "#ef4444" : "#2ee59d"}`,
                          }}
                        />
                        <span
                          style={{
                            fontSize: 13,
                            color: serviceColor(svc.name),
                            fontWeight: 500,
                          }}
                        >
                          {svc.name}
                        </span>
                      </div>
                      {hasIssue && (
                        <AlertTriangle size={13} color="#f59e0b" />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Live stream */}
            <LiveStreamCard
              title="Live Log Stream"
              entries={streamEntries}
              isLive={isLive}
              height={320}
              showServiceName
            />
          </div>
        </div>
      </div>
    </CompactShell>
  );
}
