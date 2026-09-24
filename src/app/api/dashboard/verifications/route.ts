import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/middleware/auth";
import { listVerificationJobsForOwner } from "@/lib/modules/verifications/verification.service";
import { parseComparisons, scoreFromComparisons } from "@/lib/modules/verifications/score";
import { databaseErrorMessage } from "@/lib/config/prisma";

export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req);
  if ("error" in auth) return auth.error;

  try {
    const jobs = await listVerificationJobsForOwner(auth.payload.id);
    const items = jobs.map((job) => {
      const comparisons = parseComparisons(job.report?.comparisons);
      return {
        id: job.id,
        status: job.status,
        score: scoreFromComparisons(comparisons),
        repository: job.repository,
        commitSha: job.commitSha,
        pullRequestNumber: job.pullRequestNumber,
        service: job.service,
        summary: job.report?.summary ?? null,
        createdAt: job.createdAt.toISOString(),
        completedAt: job.completedAt?.toISOString() ?? null,
      };
    });

    const finished = items.filter((job) => job.score !== null);
    const averageScore =
      finished.length > 0
        ? Math.round(finished.reduce((sum, job) => sum + (job.score ?? 0), 0) / finished.length)
        : null;

    return NextResponse.json({
      summary: {
        total: items.length,
        passed: items.filter((job) => job.status === "PASSED").length,
        warning: items.filter((job) => job.status === "WARNING").length,
        failed: items.filter((job) => job.status === "FAILED" || job.status === "ERROR").length,
        averageScore,
      },
      jobs: items,
    });
  } catch (error) {
    return NextResponse.json(
      { message: databaseErrorMessage(error) },
      { status: 500 }
    );
  }
}
