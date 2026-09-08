import { NextRequest, NextResponse } from "next/server";
import { verifyVerificationToken } from "@/lib/middleware/verification-auth";
import { createVerificationJob } from "@/lib/modules/verifications/verification.service";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNumericRecord = (value: Record<string, unknown>) =>
  Object.values(value).every((entry) => typeof entry === "number" && Number.isFinite(entry));

/** Creates the asynchronous verification job after the runner has started its sandbox. */
export async function POST(req: NextRequest) {
  const unauthorized = verifyVerificationToken(req);
  if (unauthorized) return unauthorized;

  try {
    const body: unknown = await req.json();
    if (!isRecord(body)) throw new Error("Request body must be an object");

    const { repository, commitSha, pullRequestNumber, serviceId, baselineServiceId, thresholds, metadata } = body;
    if (
      typeof repository !== "string" || !repository ||
      typeof commitSha !== "string" || !commitSha ||
      typeof pullRequestNumber !== "number" || !Number.isInteger(pullRequestNumber) || typeof serviceId !== "string" || !serviceId ||
      (baselineServiceId !== undefined && typeof baselineServiceId !== "string") ||
      (thresholds !== undefined && (!isRecord(thresholds) || !isNumericRecord(thresholds))) ||
      (metadata !== undefined && !isRecord(metadata))
    ) {
      throw new Error("Invalid verification job payload");
    }

    const job = await createVerificationJob({
      repository,
      commitSha,
      pullRequestNumber,
      serviceId,
      baselineServiceId,
      thresholds: thresholds as Record<string, number> | undefined,
      metadata,
    });

    return NextResponse.json({ jobId: job.id, status: job.status }, { status: 202 });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to create verification job" },
      { status: 400 }
    );
  }
}
