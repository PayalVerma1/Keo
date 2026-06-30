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
      <div className="flex items-start justify-between">
        <div>
          <span className={`insight-badge ${badgeTone}`}>{badge}</span>
          <span className="insight-time">{time}</span>
        </div>
        <AlertTriangle size={24} className="text-[var(--text-muted)] opacity-30" aria-hidden="true" />
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
    const loadInsights = async () => {
      try {
        const token = localStorage.getItem("obs_token");
        if (!token) return;

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
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unable to load insights");
      } finally {
        setLoading(false);
      }
    };

    loadInsights();
  }, []);

  return (
    <div className="card flex-1">
      <div className="card-header mb-0">
        <div className="flex items-center gap-2">
          <BrainCircuit size={18} className="text-indigo-300" aria-hidden="true" />
          <span className="text-base font-semibold">AI Insights</span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 size={20} className="spin text-[var(--accent-green)]" aria-hidden="true" />
        </div>
      ) : error ? (
        <div className="py-4 text-[var(--text-secondary)]">{error}</div>
      ) : insights.length === 0 ? (
        <div className="py-4 text-[var(--text-secondary)]">No AI insights have been generated yet.</div>
      ) : (
        insights.map((insight) => {
          const severity = insight.severity?.toUpperCase() ?? "INFO";
          const badgeTone = severity === "CRITICAL" ? "critical" : "warning";
          const description = insight.rootCause ?? insight.reasons?.join(", ") ?? insight.recommendation ?? "No additional details were provided.";

          return (
            <InsightItem
              key={insight.id ?? `${insight.serviceId}-${insight.createdAt ?? severity}`}
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
