"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { ArrowLeft } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { ErrorBanner } from "@/components/dashboard/error-banner";
import { StatusPill } from "@/components/dashboard/status-pill";
import { useSocketState } from "@/lib/useSocketState";
import type { MetricComparison } from "@/lib/modules/verifications/score";

type PrReport = {
  id: string;
  status: string;
  score: number | null;
  repository: string;
  commitSha: string;
  pullRequestNumber: number;
  service: { id: string; name: string };
  summary: string | null;
  comparisons: MetricComparison[];
  recommendations: {
    rootCause?: string;
    recommendation?: string;
    findings?: Array<{
      id: string;
      route: string | null;
      metric: string;
      fileHint: string | null;
      retry: string;
      verdict: string;
      deltaPercent: number;
    }>;
  } | null;
  createdAt: string;
  completedAt: string | null;
};

export default function PrReportPage() {
  const router = useRouter();
  const params = useParams<{ jobId: string }>();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [report, setReport] = useState<PrReport | null>(null);
  const socketState = useSocketState();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const fetchReport = useCallback(async () => {
    if (!params.jobId) return;
    try {
      const response = await fetch(`/api/dashboard/verifications/${params.jobId}`);
      if (response.status === 401) {
        router.replace("/login");
        return;
      }
      if (response.status === 404) throw new Error("This PR report was not found");
      if (!response.ok) throw new Error("Failed to load PR report");
      setReport((await response.json()) as PrReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load PR report");
    } finally {
      setLoading(false);
    }
  }, [params.jobId, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchReport();
  }, [status, fetchReport]);

  const handleLogout = () => signOut({ callbackUrl: "/login" });

  if (status === "loading" || status === "unauthenticated") return null;

  return (
    <div className="layout-wrapper">
      <Sidebar onLogout={handleLogout} userName={session?.user?.name ?? ""} socketState={socketState} />
      <main className="main-content">
        <Topbar userName={session?.user?.name ?? undefined} />
        <div className="dashboard-scroll-area">
          <div className="page-hero">
            <div className="page-title-wrap">
              <button
                type="button"
                className="mb-2 inline-flex min-h-10 items-center gap-2 rounded-md border-0 bg-transparent px-0 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-dark)]"
                onClick={() => router.push("/prs")}
              >
                <ArrowLeft size={16} aria-hidden="true" />
                All GitHub checks
              </button>
              <h1 className="page-title">
                {loading ? "PR report" : report ? `${report.repository} #${report.pullRequestNumber}` : "PR report"}
              </h1>
              <p className="page-subtitle">
                Baseline comparison for this pull request. Findings are structured for an agent to retry; Gemini does not decide the verdict.
              </p>
            </div>
            {report && (
              <div className="page-actions items-center gap-3">
                <span className="score-num text-3xl">{report.score === null ? "—" : report.score}</span>
                <StatusPill status={report.status} />
              </div>
            )}
          </div>

          {error && (
            <ErrorBanner
              message={error}
              onRetry={() => {
                setError("");
                setLoading(true);
                fetchReport();
              }}
            />
          )}

          {loading ? (
            <div className="space-y-4">
              <div className="card h-28 animate-pulse" />
              <div className="card h-64 animate-pulse" />
            </div>
          ) : report ? (
            <>
              <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="card">
                  <div className="card-title">Commit</div>
                  <p className="mt-2 font-mono text-sm">{report.commitSha}</p>
                </div>
                <div className="card">
                  <div className="card-title">Application</div>
                  <p className="mt-2 text-sm">{report.service.name}</p>
                </div>
                <div className="card">
                  <div className="card-title">Completed</div>
                  <p className="mt-2 text-sm">
                    {report.completedAt ? new Date(report.completedAt).toLocaleString() : "Still collecting"}
                  </p>
                </div>
              </div>

              {report.summary && (
                <div className="card mb-5">
                  <div className="card-title mb-2">Summary</div>
                  <p className="max-w-prose text-sm leading-6 text-[var(--text-secondary)]">{report.summary}</p>
                </div>
              )}

              <div className="card mb-5 overflow-x-auto">
                <div className="card-title mb-3">Metric comparison</div>
                {report.comparisons.length === 0 ? (
                  <p className="text-sm text-[var(--text-secondary)]">
                    No comparison yet. The job is still collecting telemetry or did not have enough samples.
                  </p>
                ) : (
                  <table className="pr-score-table">
                    <thead>
                      <tr>
                        <th scope="col">Metric</th>
                        <th scope="col">Baseline</th>
                        <th scope="col">PR</th>
                        <th scope="col">Change</th>
                        <th scope="col">Limit</th>
                        <th scope="col">Verdict</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.comparisons.map((comparison) => (
                        <tr key={comparison.metric}>
                          <td className="capitalize">{comparison.metric}</td>
                          <td>{comparison.baseline.toFixed(2)}</td>
                          <td>{comparison.observed.toFixed(2)}</td>
                          <td>
                            {comparison.deltaPercent > 0 ? "+" : ""}
                            {comparison.deltaPercent}%
                          </td>
                          <td>{comparison.thresholdPercent}%</td>
                          <td>
                            <StatusPill status={comparison.verdict} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="card">
                <div className="card-title mb-2">Agent findings</div>
                {report.recommendations?.findings?.length ? (
                  <div className="space-y-4 text-sm leading-6 text-[var(--text-secondary)]">
                    {report.recommendations.findings.map((finding) => (
                      <div key={finding.id} className="border-b border-[var(--border-color)] pb-3 last:border-0 last:pb-0">
                        <p className="font-semibold text-[var(--text-primary)]">
                          {finding.metric}{" "}
                          <span className="font-normal text-[var(--text-secondary)]">
                            {finding.deltaPercent > 0 ? "+" : ""}
                            {finding.deltaPercent}%
                          </span>
                        </p>
                        <p className="mt-1">{finding.retry}</p>
                        {finding.fileHint && (
                          <p className="mt-1 font-mono text-xs">{finding.fileHint}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : report.recommendations?.rootCause || report.recommendations?.recommendation ? (
                  <div className="max-w-prose space-y-3 text-sm leading-6 text-[var(--text-secondary)]">
                    {report.recommendations.rootCause && (
                      <p>
                        <span className="font-semibold text-[var(--text-primary)]">Root cause. </span>
                        {report.recommendations.rootCause}
                      </p>
                    )}
                    {report.recommendations.recommendation && (
                      <p>
                        <span className="font-semibold text-[var(--text-primary)]">Next step. </span>
                        {report.recommendations.recommendation}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-secondary)]">
                    No structured findings for this run. The verdict still comes from the fingerprint thresholds.
                  </p>
                )}
              </div>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}
