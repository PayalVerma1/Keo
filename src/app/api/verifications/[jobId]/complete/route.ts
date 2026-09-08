import { NextRequest, NextResponse } from "next/server";
import { verifyVerificationToken } from "@/lib/middleware/verification-auth";
import { completeVerificationJob, getVerificationJob } from "@/lib/modules/verifications/verification.service";
import { publishVerificationJob } from "@/lib/streams/producers";

/** Marks the telemetry window complete and hands the job to the verification worker. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const unauthorized = verifyVerificationToken(req);
  if (unauthorized) return unauthorized;

  try {
    const { jobId } = await params;
    const existingJob = await getVerificationJob(jobId);
    if (!existingJob) return NextResponse.json({ message: "Verification job not found" }, { status: 404 });
    if (existingJob.status !== "QUEUED") {
      return NextResponse.json({ message: "Verification job is already complete" }, { status: 409 });
    }

    const job = await completeVerificationJob(jobId);
    await publishVerificationJob({ jobId: job.id });
    return NextResponse.json({ jobId: job.id, status: job.status }, { status: 202 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to complete verification job" },
      { status: 500 }
    );
  }
}
