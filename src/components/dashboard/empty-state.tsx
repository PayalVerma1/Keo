import { Activity } from "lucide-react";

export function EmptyMetricsState() {
  return (
    <div
      className="card"
      style={{
        marginBottom: "24px",
        padding: "40px 20px",
        textAlign: "center",
        alignItems: "center",
      }}
    >
      <Activity size={48} color="var(--text-muted)" style={{ marginBottom: "16px" }} />
      <p style={{ fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>
        No metrics data yet
      </p>
      <p style={{ fontSize: "13px", color: "var(--text-secondary)", maxWidth: "400px" }}>
        Create a service and push metrics via{" "}
        <code
          style={{
            background: "rgba(255,255,255,0.06)",
            padding: "2px 6px",
            borderRadius: "4px",
            fontFamily: "monospace",
          }}
        >
          POST /api/metrics
        </code>{" "}
        to see live charts here.
      </p>
    </div>
  );
}
