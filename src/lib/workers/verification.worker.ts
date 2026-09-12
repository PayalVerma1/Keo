import { VerificationStatus } from "@/lib/generated/prisma";
import { client } from "../config/redis";
import { prisma } from "../config/prisma";
import { STREAMS } from "../streams/redis-streams";
import { compareToFingerprint } from "../modules/impact/compare";
import { buildFingerprint, persistFingerprint, observedFromMetricRows } from "../modules/impact/fingerprint";
import { enrichFindingsWithModel, recommendationsFromReport } from "../modules/impact/rca";

const GROUP_NAME = "verification-workers";
const CONSUMER_NAME = `verification-consumer-${process.pid}`;

const ensureGroup = async () => {
  try {
    await client.xGroupCreate(STREAMS.VERIFICATION_JOBS, GROUP_NAME, "0", { MKSTREAM: true });
  } catch (error: unknown) {
    if (!String(error).includes("BUSYGROUP")) throw error;
  }
};

const statusFromVerdict = (verdict: "ok" | "warn" | "regress" | "insufficient") => {
  if (verdict === "regress") return VerificationStatus.FAILED;
  if (verdict === "warn") return VerificationStatus.WARNING;
  if (verdict === "ok") return VerificationStatus.PASSED;
  return VerificationStatus.ERROR;
};

async function processJob(jobId: string) {
  const job = await prisma.verificationJob.findUnique({ where: { id: jobId } });
  if (!job || job.status !== VerificationStatus.COLLECTING || !job.completedAt) return;

  await prisma.verificationJob.update({ where: { id: job.id }, data: { status: VerificationStatus.PROCESSING } });
  try {
    const baselineServiceId = job.baselineServiceId ?? job.serviceId;
    const [prMetrics, fingerprint] = await Promise.all([
      prisma.metrics.findMany({
        where: { serviceId: job.serviceId, verificationJobId: job.id },
        select: { cpu: true, memory: true, latency: true, errors: true, routes: true },
      }),
      buildFingerprint(baselineServiceId, { before: job.createdAt }),
    ]);

    const observed = observedFromMetricRows(prMetrics);
    if (!observed.process && !observed.routes.length) {
      throw new Error("Insufficient PR telemetry for comparison");
    }
    if (!fingerprint.process && !fingerprint.routes.length) {
      throw new Error("Insufficient production fingerprint for comparison");
    }

    await persistFingerprint(fingerprint);

    let report = compareToFingerprint({
      fingerprint,
      process: observed.process,
      routes: observed.routes,
      thresholds: (job.thresholds as Record<string, unknown>) ?? {},
    });
    report = await enrichFindingsWithModel(report);

    const status = statusFromVerdict(report.verdict);
    const recommendations = recommendationsFromReport(report);

    await prisma.$transaction([
      prisma.verificationReport.create({
        data: {
          jobId: job.id,
          status,
          summary: report.summary,
          comparisons: report.comparisons,
          recommendations,
        },
      }),
      prisma.verificationJob.update({ where: { id: job.id }, data: { status } }),
    ]);
  } catch (error) {
    const summary = error instanceof Error ? error.message : "Verification processing failed";
    await prisma.$transaction([
      prisma.verificationReport.upsert({
        where: { jobId: job.id },
        create: { jobId: job.id, status: VerificationStatus.ERROR, summary, comparisons: [] },
        update: { status: VerificationStatus.ERROR, summary },
      }),
      prisma.verificationJob.update({ where: { id: job.id }, data: { status: VerificationStatus.ERROR } }),
    ]);
    throw error;
  }
}

export async function startVerificationWorker() {
  await ensureGroup();
  console.log("Verification worker started");
  while (true) {
    const result = await client.xReadGroup(
      GROUP_NAME, CONSUMER_NAME, [{ key: STREAMS.VERIFICATION_JOBS, id: ">" }], { COUNT: 10, BLOCK: 500 }
    );
    if (!result) continue;
    for (const { messages } of result) for (const { id, message } of messages) {
      try {
        const payload = JSON.parse(message.payload) as { jobId?: string };
        if (!payload.jobId) throw new Error("Verification stream message is missing jobId");
        await processJob(payload.jobId);
        await client.xAck(STREAMS.VERIFICATION_JOBS, GROUP_NAME, id);
      } catch (error) {
        console.error("Failed to process verification job:", error);
      }
    }
  }
}
