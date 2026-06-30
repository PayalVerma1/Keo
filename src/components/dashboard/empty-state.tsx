import { Activity } from "lucide-react";

export function EmptyMetricsState() {
  return (
    <div className="card mb-6 items-center px-5 py-10 text-center">
      <Activity size={48} className="mb-4 text-[var(--text-muted)]" aria-hidden="true" />
      <p className="mb-2 text-base font-semibold">
        No metrics data yet
      </p>
      <p className="max-w-[400px] text-[13px] text-[var(--text-secondary)]">
        Create a service and push metrics via{" "}
        <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono">
          POST /api/metrics
        </code>{" "}
        to see live charts here.
      </p>
    </div>
  );
}
