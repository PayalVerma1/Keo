"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BrainCircuit,
  Filter,
  Plus,
  RefreshCw,
  Rocket,
} from "lucide-react";
import { CompactShell, CompactTopbar } from "@/components/dashboard/app-shell";
import type { Deployment, Insight, Service } from "@/components/dashboard/types";
import { formatDeploymentDate, serviceColor } from "@/components/dashboard/utils";
import {
  ActionButton,
  Badge,
  EmptyState,
  LoadingSpinner,
  SectionHeader,
  StatCard,
} from "@/components/dashboard/ui";
import { LiveStreamCard, useLiveEntries, type StreamEntry } from "@/components/dashboard/live-stream";

// ── Deployment row ────────────────────────────────────────────────────────────
function DeploymentRow({
  deployment,
  index,
  serviceName,
  hasAnomaly,
  anomalyNote,
  isExpanded,
  onToggle,
}: {
  deployment: Deployment;
  index: number;
  serviceName: string;
  hasAnomaly: boolean;
  anomalyNote: string;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const isLatest = index === 0;
  const isStaging = index === 1;

  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          width: "100%",
          padding: "14px 20px",
          cursor: "pointer",
          background: "transparent",
          border: "none",
          textAlign: "left",
        }}
      >
        {/* Status dot */}
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: isLatest ? "#2ee59d" : "rgba(255,255,255,0.2)",
            flexShrink: 0,
            boxShadow: isLatest ? "0 0 8px #2ee59d" : "none",
          }}
        />

        {/* Version */}
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: isLatest ? "#fff" : "rgba(255,255,255,0.6)",
            minWidth: 80,
            fontFamily: "monospace",
          }}
        >
          {deployment.version}
        </span>

        <Badge variant="success">SUCCESS</Badge>

        <Badge variant="neutral">{isStaging ? "STAGING" : "PRODUCTION"}</Badge>

        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: serviceColor(serviceName),
            letterSpacing: "0.3px",
          }}
        >
          {serviceName}
        </span>

        {hasAnomaly && (
          <Badge variant="medium">
            <AlertTriangle size={10} /> ANOMALY DETECTED
          </Badge>
        )}

        <div style={{ flex: 1 }} />

        <span
          style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.35)",
            fontFamily: "monospace",
          }}
        >
          {formatDeploymentDate(deployment.createdAt)}
        </span>

        {index > 0 && (
          <Badge variant="neutral">
            <RefreshCw size={11} /> Retry
          </Badge>
        )}
      </button>

      {isExpanded && (
        <div
          style={{
            margin: "0 20px 14px",
            padding: 16,
            background: "rgba(255,255,255,0.03)",
            borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.07)",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 20,
          }}
        >
          <MetaField label="Commit" value={`feat: deployment ${deployment.version}`} mono />
          <MetaField label="Service" value={serviceName} />
          <MetaField label="Environment" value={isStaging ? "Staging" : "Production"} />
          {hasAnomaly && anomalyNote && (
            <MetaField label="AI Alert" value={anomalyNote} warning />
          )}
        </div>
      )}
    </div>
  );
}

function MetaField({
  label,
  value,
  mono,
  warning,
}: {
  label: string;
  value: string;
  mono?: boolean;
  warning?: boolean;
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          color: warning ? "#f59e0b" : "rgba(255,255,255,0.3)",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 12,
          color: warning ? "#f59e0b" : "rgba(255,255,255,0.7)",
          fontFamily: mono ? "monospace" : undefined,
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ── AI Log Analysis card ──────────────────────────────────────────────────────
function AiLogAnalysisCard({ insights }: { insights: Insight[] }) {
  return (
    <div
      style={{
        background: "#111218",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 10,
        padding: 20,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          color: "rgba(255,255,255,0.4)",
          marginBottom: 16,
        }}
      >
        AI Log Analysis
      </div>
      {insights.length === 0 ? (
        <div style={{ textAlign: "center", padding: "30px 0" }}>
          <BrainCircuit size={28} color="rgba(255,255,255,0.15)" style={{ margin: "0 auto 10px" }} />
          <p style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>
            No anomalies detected post-deploy
          </p>
        </div>
      ) : (
        insights.slice(0, 4).map((insight, idx) => (
          <div
            key={insight.id ?? idx}
            style={{
              padding: "12px 0",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <BrainCircuit size={12} color="#a5b4fc" />
              <Badge variant="low" size="xs">
                {insight.severity}
              </Badge>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#a5b4fc" }}>
                Anomaly {String.fromCharCode(65 + idx)}-{10 + idx}
              </span>
            </div>
            <p
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.6)",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {insight.rootCause?.slice(0, 120)}
              {insight.rootCause?.length > 120 ? "..." : ""}
            </p>
          </div>
        ))
      )}
    </div>
  );
}

// ── Health metrics mini-chart ─────────────────────────────────────────────────
function HealthMetricsCard({
  hasDeployments,
  version,
}: {
  hasDeployments: boolean;
  version?: string;
}) {
  return (
    <div
      style={{
        background: "#111218",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 10,
        padding: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <span
          style={{
            fontWeight: 600,
            color: "rgba(255,255,255,0.7)",
            textTransform: "uppercase",
            letterSpacing: "0.4px",
            fontSize: 11,
          }}
        >
          Health Metrics Post-Deploy {version && `(${version})`}
        </span>
        <span style={{ fontSize: 11, color: "#2ee59d", fontWeight: 600 }}>Real-time</span>
      </div>
      <div style={{ height: 160, display: "flex", alignItems: "flex-end", gap: 4 }}>
        {!hasDeployments ? (
          <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, margin: "auto" }}>
            No deployment data
          </p>
        ) : (
          Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                background: `rgba(${i > 18 ? "239,68,68" : "46,200,133"},0.3)`,
                borderRadius: "2px 2px 0 0",
                height: `${30 + Math.sin(i * 0.7 + 1) * 25 + i * 2}px`,
                transition: "height 0.3s",
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DeploymentsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const tokenRef = useRef<string | null>(null);

  const fetchAll = useCallback(
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

        const [deployGroups, insightGroups] = await Promise.all([
          Promise.all(
            svcs.map((svc) =>
              fetch(`/api/deployments/${svc.id}`, {
                headers: { Authorization: `Bearer ${token}` },
              })
                .then((r) => (r.ok ? r.json() : []))
                .catch(() => [])
            )
          ),
          Promise.all(
            svcs.map((svc) =>
              fetch(`/api/insights/${svc.id}`, {
                headers: { Authorization: `Bearer ${token}` },
              })
                .then((r) => (r.ok ? r.json() : []))
                .catch(() => [])
            )
          ),
        ]);

        setDeployments(
          (deployGroups.flat() as Deployment[]).sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
        setInsights(insightGroups.flat() as Insight[]);
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
    void fetchAll(token);
  }, [fetchAll, router]);

  // ── Live stream: use logs as the event feed ───────────────────────────────
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
      type RawLog = { id: string; createdAt: string; level: string; message: string; serviceId: string };
      return (groups.flat() as RawLog[])
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 30)
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
    intervalMs: 6000,
  });

  // ── Derived ───────────────────────────────────────────────────────────────
  const filtered = deployments.filter(
    (d) => !search || d.version.toLowerCase().includes(search.toLowerCase())
  );

  const anomalyCount = insights.filter((i) =>
    ["critical", "high"].includes(i.severity)
  ).length;

  const avgMs =
    deployments.length > 1
      ? deployments
          .slice(0, -1)
          .reduce(
            (acc, d, i) =>
              acc +
              Math.abs(
                new Date(d.createdAt).getTime() -
                  new Date(deployments[i + 1].createdAt).getTime()
              ),
            0
          ) / Math.max(1, deployments.length - 1)
      : 0;

  const avgDeployTime =
    avgMs > 0 ? `${Math.floor(avgMs / 60000)}m ${Math.floor((avgMs % 60000) / 1000)}s` : "—";

  if (!mounted) return null;

  return (
    <CompactShell active="/deployments">
      <CompactTopbar placeholder="Search deployments..." search={search} onSearch={setSearch} />

      <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
        <SectionHeader
          title="Deployments"
          description="Global deployment history and anomaly correlation."
        >
          <ActionButton variant="secondary">
            <Filter size={13} /> Filter
          </ActionButton>
          <ActionButton variant="primary">
            <Plus size={13} /> New Deployment
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
          <StatCard
            label="Success Rate (24h)"
            value={deployments.length > 0 ? "98.4%" : "—"}
            color="#2ee59d"
          />
          <StatCard label="Total Deployments" value={deployments.length} />
          <StatCard label="Avg. Deploy Gap" value={avgDeployTime} />
          <StatCard
            label="AI Anomaly Triggers"
            value={`${anomalyCount} Events`}
            color="#f59e0b"
          />
        </div>

        {/* Deployment list */}
        <div
          style={{
            background: "#111218",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 10,
            marginBottom: 20,
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 20px",
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
                background: "#2ee59d",
                boxShadow: "0 0 6px #2ee59d",
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
              Deployment History
            </span>
            <span
              style={{
                marginLeft: "auto",
                fontSize: 12,
                color: "rgba(255,255,255,0.3)",
              }}
            >
              {filtered.length} records
            </span>
          </div>

          {loading ? (
            <LoadingSpinner label="Loading deployments..." />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Rocket size={36} />}
              title="No deployments yet"
              description="Generate telemetry from a service to record a deployment."
            />
          ) : (
            <div style={{ padding: "4px 0" }}>
              {filtered.map((dep, idx) => {
                const svcName =
                  services.find((s) => s.id === dep.serviceId)?.name ?? dep.serviceId;
                const hasAnomaly = insights.some(
                  (i) =>
                    i.serviceId === dep.serviceId &&
                    ["critical", "high"].includes(i.severity)
                );
                const anomalyNote =
                  insights.find(
                    (i) =>
                      i.serviceId === dep.serviceId &&
                      ["critical", "high"].includes(i.severity)
                  )?.rootCause?.slice(0, 80) ?? "";

                return (
                  <DeploymentRow
                    key={dep.id ?? idx}
                    deployment={dep}
                    index={idx}
                    serviceName={svcName}
                    hasAnomaly={hasAnomaly}
                    anomalyNote={anomalyNote}
                    isExpanded={expanded === (dep.id ?? `${idx}`)}
                    onToggle={() =>
                      setExpanded(
                        expanded === (dep.id ?? `${idx}`)
                          ? null
                          : dep.id ?? `${idx}`
                      )
                    }
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom grid: health chart + AI analysis + live stream */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 16,
          }}
        >
          <HealthMetricsCard
            hasDeployments={filtered.length > 0}
            version={filtered[0]?.version}
          />
          <AiLogAnalysisCard insights={insights} />
          <LiveStreamCard
            title="Event Stream"
            entries={streamEntries}
            isLive={isLive}
            height={200}
            showServiceName
          />
        </div>
      </div>
    </CompactShell>
  );
}
