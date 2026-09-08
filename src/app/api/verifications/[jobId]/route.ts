import { NextRequest, NextResponse } from "next/server";
import { verifyVerificationToken } from "@/lib/middleware/verification-auth";
import { getVerificationJob } from "@/lib/modules/verifications/verification.service";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  const unauthorized = verifyVerificationToken(_req);
  if (unauthorized) return unauthorized;

  const { jobId } = await params;
  const job = await getVerificationJob(jobId);
  if (!job) return NextResponse.json({ message: "Verification job not found" }, { status: 404 });

  return NextResponse.json(job);
}
