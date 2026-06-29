import { Activity, AlertTriangle, Clock, Layers, TrendingUp } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: React.ReactNode;
  subtitle: string;
  icon: React.ReactNode;
  accent?: string;
  trend?: "up" | "down" | "neutral";
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon,
  accent,
  trend = "neutral",
}: MetricCardProps) {
  const trendClass = trend === "up" ? "trend-up" : trend === "down" ? "trend-down" : "";

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">{title}</span>
        {icon}
      </div>
      <div className="stat-value" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
      <div className={`stat-trend ${trendClass}`} style={trend === "neutral" ? { color: "var(--text-secondary)" } : undefined}>
        {trend === "up" ? <TrendingUp size={14} /> : null}
        {trend === "down" ? <Activity size={14} /> : null}
        {subtitle}
      </div>
    </div>
  );
}

export function ServiceMetricCards({ loading, data }: { loading: boolean; data?: { summary?: { totalServices?: number; activeAlerts?: number; avgLatency?: string; errorRate?: string } } | null }) {
  return (
    <div className="stats-row">
      <MetricCard
        title="TOTAL SERVICES"
        value={loading ? "…" : data?.summary?.totalServices ?? 0}
        subtitle="All services"
        icon={<Layers size={16} color="var(--text-secondary)" />}
        trend="up"
      />
      <MetricCard
        title="ACTIVE ALERTS"
        value={loading ? "…" : data?.summary?.activeAlerts ?? 0}
        subtitle="High CPU or Error rate"
        icon={<AlertTriangle size={16} color="var(--accent-red)" />}
        accent="var(--accent-red)"
      />
      <MetricCard
        title="AVG LATENCY"
        value={loading ? "…" : data?.summary?.avgLatency ?? "–"}
        subtitle="Across all services"
        icon={<Clock size={16} color="var(--text-secondary)" />}
        trend="down"
      />
      <MetricCard
        title="ERROR RATE"
        value={loading ? "…" : data?.summary?.errorRate ?? "–"}
        subtitle="Average across services"
        icon={<Activity size={16} color="var(--accent-green)" />}
      />
    </div>
  );
}
