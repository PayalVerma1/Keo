import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/middleware/auth";
import { getVerificationJobForOwner } from "@/lib/modules/verifications/verification.service";
import { parseComparisons, scoreFromComparisons } from "@/lib/modules/verifications/score";

export async function GET(req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const auth = await verifyAuth(req);
  if ("error" in auth) return auth.error;

  const { jobId } = await params;
  const job = await getVerificationJobForOwner(auth.payload.id, jobId);
  if (!job) return NextResponse.json({ message: "PR report not found" }, { status: 404 });

  const comparisons = parseComparisons(job.report?.comparisons);
  const recommendations =
    job.report?.recommendations &&
    typeof job.report.recommendations === "object" &&
    !Array.isArray(job.report.recommendations)
      ? (job.report.recommendations as { rootCause?: string; recommendation?: string })
      : null;

  return NextResponse.json({
    id: job.id,
    status: job.status,
    score: scoreFromComparisons(comparisons),
    repository: job.repository,
    commitSha: job.commitSha,
    pullRequestNumber: job.pullRequestNumber,
    service: job.service,
    summary: job.report?.summary ?? null,
    comparisons,
    recommendations,
    createdAt: job.createdAt.toISOString(),
    completedAt: job.completedAt?.toISOString() ?? null,
  });
}
