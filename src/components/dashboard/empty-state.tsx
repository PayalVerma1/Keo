import { Activity, GitPullRequest } from "lucide-react";

export function EmptyMetricsState() {
  return (
    <div className="card mb-6 flex flex-col items-center px-5 py-10 text-center">
      <Activity size={48} className="mb-4 text-[var(--text-muted)]" aria-hidden="true" />
      <p className="mb-2 text-base font-semibold">No metrics data yet</p>
      <p className="max-w-[400px] text-[13px] text-[var(--text-secondary)]">
        Create an application and send sandbox telemetry to see charts here.
      </p>
    </div>
  );
}

export function EmptyPrScoresState() {
  return (
    <div className="card mb-6 flex flex-col items-center px-5 py-10 text-center">
      <GitPullRequest size={48} className="mb-4 text-[var(--text-muted)]" aria-hidden="true" />
      <p className="mb-2 text-base font-semibold">No pull requests scored yet</p>
      <p className="mx-auto max-w-[440px] text-[13px] text-[var(--text-secondary)]">
        Register an application, install the SDK, and open a PR with the Keo workflow. Scores show up here.
      </p>
      <a
        href="/docs"
        className="mt-4 inline-flex min-h-10 items-center justify-center rounded-md bg-[var(--accent-green)] px-4 text-sm font-semibold text-[var(--on-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]"
      >
        Read setup docs
      </a>
    </div>
  );
}
