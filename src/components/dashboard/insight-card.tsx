import { useEffect, useState } from "react";
import { AlertTriangle, BrainCircuit, Loader2 } from "lucide-react";

interface InsightItemProps {
  badge: string;
  time: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
  badgeTone?: "critical" | "warning";
}

interface InsightRecord {
  id?: string;
  severity?: string;
  rootCause?: string;
  recommendation?: string;
  reasons?: string[];
  createdAt?: string;
  serviceId: string;
  serviceName?: string;
}

function InsightItem({ badge, time, title, description, actions, badgeTone = "warning" }: InsightItemProps) {
  return (
    <div className="insight-item">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <span className={`insight-badge ${badgeTone}`}>{badge}</span>
          <span className="insight-time">{time}</span>
        </div>
        <AlertTriangle size={24} color="var(--text-muted)" opacity={0.3} />
      </div>
      <div className="insight-title">{title}</div>
      <div className="insight-desc">{description}</div>
      <div>{actions}</div>
    </div>
  );
}

export function InsightsPanel() {
  const [insights, setInsights] = useState<InsightRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("obs_token");
    if (!token) {
      setLoading(false);
      return;
    }

    const loadInsights = async () => {
      try {
        const servicesRes = await fetch("/api/services", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!servicesRes.ok) throw new Error("Failed to load services");
        const services = (await servicesRes.json()) as Array<{ id: string; name: string }>;

        const insightRequests = services.map(async (service) => {
          const res = await fetch(`/api/insights/${service.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) return [] as InsightRecord[];
          const entries = (await res.json()) as Array<Omit<InsightRecord, "serviceName">>;
          return entries.map((entry) => ({ ...entry, serviceId: service.id, serviceName: service.name }));
        });

        const settled = (await Promise.all(insightRequests)).flat();
        const latest = settled
          .slice()
          .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
          .slice(0, 3);

        setInsights(latest);
      } catch (err: any) {
        setError(err.message || "Unable to load insights");
      } finally {
        setLoading(false);
      }
    };

    loadInsights();
  }, []);

  return (
    <div className="card" style={{ flex: 1 }}>
      <div className="card-header" style={{ marginBottom: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <BrainCircuit size={18} color="#a5b4fc" />
          <span style={{ fontSize: "16px", fontWeight: 600 }}>AI Insights</span>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
          <Loader2 size={20} className="spin" color="var(--accent-green)" />
        </div>
      ) : error ? (
        <div style={{ padding: "16px 0", color: "var(--text-secondary)" }}>{error}</div>
      ) : insights.length === 0 ? (
        <div style={{ padding: "16px 0", color: "var(--text-secondary)" }}>No AI insights have been generated yet.</div>
      ) : (
        insights.map((insight) => {
          const severity = insight.severity?.toUpperCase() ?? "INFO";
          const badgeTone = severity === "CRITICAL" ? "critical" : "warning";
          const description = insight.rootCause ?? insight.reasons?.join(", ") ?? insight.recommendation ?? "No additional details were provided.";

          return (
            <InsightItem
              key={`${insight.serviceId}-${insight.createdAt}-${insight.id ?? Math.random()}`}
              badge={severity}
              time={insight.createdAt ? new Date(insight.createdAt).toLocaleString() : "Recently detected"}
              title={`${insight.serviceName ?? insight.serviceId} • ${severity.toLowerCase()}`}
              description={description}
              badgeTone={badgeTone}
            />
          );
        })
      )}
    </div>
  );
}
