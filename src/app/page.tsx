"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { ErrorBanner } from "@/components/dashboard/error-banner";
import { EmptyPrScoresState } from "@/components/dashboard/empty-state";
import { StatusPill } from "@/components/dashboard/status-pill";
import { useSocketState } from "@/lib/useSocketState";

type PrScoreJob = {
  id: string;
  status: string;
  score: number | null;
  repository: string;
  commitSha: string;
  pullRequestNumber: number;
  service: { id: string; name: string };
  summary: string | null;
  createdAt: string;
  completedAt: string | null;
};

type DashboardPayload = {
  summary: {
    total: number;
    passed: number;
    warning: number;
    failed: number;
    averageScore: number | null;
  };
  jobs: PrScoreJob[];
};

function shortSha(sha: string) {
  return sha.slice(0, 7);
}

export default function Dashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [query, setQuery] = useState("");
  const socketState = useSocketState();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  const fetchScores = useCallback(async () => {
    try {
      const response = await fetch("/api/dashboard/verifications");
      if (response.status === 401) {
        router.replace("/login");
        return;
      }
      if (!response.ok) throw new Error("Failed to load PR scores");
      setData((await response.json()) as DashboardPayload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load PR scores");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetchScores();
  }, [status, fetchScores]);

  const filteredJobs = useMemo(() => {
    const jobs = data?.jobs ?? [];
    const needle = query.trim().toLowerCase();
    if (!needle) return jobs;
    return jobs.filter((job) =>
      [job.repository, job.commitSha, `#${job.pullRequestNumber}`, job.service.name, job.status]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [data?.jobs, query]);

  const handleLogout = () => signOut({ callbackUrl: "/login" });

  if (status === "loading" || status === "unauthenticated") return null;

  return (
    <div className="layout-wrapper">
      <Sidebar onLogout={handleLogout} userName={session?.user?.name ?? ""} socketState={socketState} />

      <main className="main-content">
        <Topbar
          userName={session?.user?.name ?? undefined}
          searchValue={query}
          onSearchChange={setQuery}
        />

        <div className="dashboard-scroll-area">
          <div className="page-hero">
            <div className="page-title-wrap">
              <h1 className="page-title">PR scores</h1>
              <p className="page-subtitle">
                Each pull request is scored against a production baseline. Open a report for metrics, diffs, and recommendations.
              </p>
            </div>
          </div>

          {error && (
            <ErrorBanner
              message={error}
              onRetry={() => {
                setError("");
                setLoading(true);
                fetchScores();
              }}
            />
          )}

          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="card h-24 animate-pulse bg-[var(--bg-card)]" />
              ))
            ) : (
              <>
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Scored PRs</span>
                  </div>
                  <div className="stat-value">{data?.summary.total ?? 0}</div>
                </div>
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Passing</span>
                  </div>
                  <div className="stat-value">{data?.summary.passed ?? 0}</div>
                </div>
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Failed</span>
                  </div>
                  <div className="stat-value">{data?.summary.failed ?? 0}</div>
                </div>
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Average score</span>
                  </div>
                  <div className="stat-value">
                    {data?.summary.averageScore === null || data?.summary.averageScore === undefined
                      ? "—"
                      : data.summary.averageScore}
                  </div>
                </div>
              </>
            )}
          </div>

          {loading ? (
            <div className="card overflow-hidden">
              <div className="space-y-3 p-4">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-12 animate-pulse rounded-md bg-[var(--hover-fill)]" />
                ))}
              </div>
            </div>
          ) : !data?.jobs.length ? (
            <EmptyPrScoresState />
          ) : filteredJobs.length === 0 ? (
            <div className="card px-5 py-10 text-center">
              <p className="mb-2 text-base font-semibold">No matching pull requests</p>
              <p className="text-[13px] text-[var(--text-secondary)]">Try a repository, PR number, or SHA.</p>
            </div>
          ) : (
            <div className="card overflow-x-auto">
              <table className="pr-score-table">
                <thead>
                  <tr>
                    <th scope="col">Pull request</th>
                    <th scope="col">Application</th>
                    <th scope="col">Score</th>
                    <th scope="col">Verdict</th>
                    <th scope="col">When</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map((job) => (
                    <tr
                      key={job.id}
                      className="pr-score-row"
                      onClick={() => router.push(`/prs/${job.id}`)}
                    >
                      <td>
                        <button
                          type="button"
                          className="min-h-10 w-full cursor-pointer border-0 bg-transparent p-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A8B5C8] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]"
                          onClick={(event) => {
                            event.stopPropagation();
                            router.push(`/prs/${job.id}`);
                          }}
                        >
                          <div className="font-semibold">
                            {job.repository} #{job.pullRequestNumber}
                          </div>
                          <div className="mt-1 font-mono text-xs text-[var(--text-secondary)]">
                            {shortSha(job.commitSha)}
                          </div>
                        </button>
                      </td>
                      <td className="text-[var(--text-secondary)]">{job.service.name}</td>
                      <td className="score-num">{job.score === null ? "—" : job.score}</td>
                      <td>
                        <StatusPill status={job.status} />
                      </td>
                      <td className="whitespace-nowrap text-[var(--text-secondary)]">
                        {new Date(job.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
