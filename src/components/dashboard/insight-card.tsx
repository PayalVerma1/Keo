import { AlertTriangle, BrainCircuit } from "lucide-react";

interface InsightItemProps {
  badge: string;
  time: string;
  title: string;
  description: string;
  actions: React.ReactNode;
  badgeTone?: "critical" | "warning";
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
  return (
    <div className="card" style={{ flex: 1 }}>
      <div className="card-header" style={{ marginBottom: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <BrainCircuit size={18} color="#a5b4fc" />
          <span style={{ fontSize: "16px", fontWeight: 600 }}>AI Insights</span>
        </div>
      </div>

      <InsightItem
        badge="CRITICAL"
        time="2m ago"
        title="Abnormal Latency Spike: Auth-Service"
        description="Auth-Service P99 latency increased by 450ms. Potential connection pool exhaustion detected in 'db-cluster-01'."
        actions={<button className="btn-outline">INVESTIGATE ROOT CAUSE</button>}
        badgeTone="critical"
      />

      <InsightItem
        badge="WARNING"
        time="15m ago"
        title="Memory Leak Warning"
        description="Container 'ingest-worker-3' showing linear memory growth (85% utilization). Estimated OOM in 42 minutes."
        actions={
          <>
            <button className="btn-outline">RESTART NODE</button>
            <button className="btn-outline">IGNORE</button>
          </>
        }
      />
    </div>
  );
}
