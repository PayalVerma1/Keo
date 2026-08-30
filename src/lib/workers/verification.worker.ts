import { VerificationStatus } from "@/lib/generated/prisma";
import { client } from "../config/redis";
import { prisma } from "../config/prisma";
import { STREAMS } from "../streams/redis-streams";
import { explainVerification } from "../modules/verifications/verification-analyzer.service";

const GROUP_NAME = "verification-workers";
const CONSUMER_NAME = `verification-consumer-${process.pid}`;
const DEFAULT_THRESHOLDS = { cpu: 20, memory: 20, latency: 15, errors: 10 };
type MetricKey = keyof typeof DEFAULT_THRESHOLDS;
type MetricAverage = Record<MetricKey, number>;

const ensureGroup = async () => {
  try {
    await client.xGroupCreate(STREAMS.VERIFICATION_JOBS, GROUP_NAME, "0", { MKSTREAM: true });
  } catch (error: unknown) {
    if (!String(error).includes("BUSYGROUP")) throw error;
  }
};

const averageMetrics = (metrics: Array<Record<MetricKey, number>>): MetricAverage | null => {
  if (!metrics.length) return null;
  return Object.keys(DEFAULT_THRESHOLDS).reduce((averages, key) => {
    const metricKey = key as MetricKey;
    averages[metricKey] = metrics.reduce((sum, metric) => sum + metric[metricKey], 0) / metrics.length;
    return averages;
  }, {} as MetricAverage);
};

const buildComparison = (baseline: MetricAverage, observed: MetricAverage, thresholds: Record<string, unknown>) => {
  const comparisons = Object.keys(DEFAULT_THRESHOLDS).map((key) => {
    const metric = key as MetricKey;
    const threshold = typeof thresholds[metric] === "number" ? thresholds[metric] : DEFAULT_THRESHOLDS[metric];
    const deltaPercent = baseline[metric] === 0
      ? (observed[metric] === 0 ? 0 : 100)
      : ((observed[metric] - baseline[metric]) / baseline[metric]) * 100;
    return {
      metric,
      baseline: baseline[metric],
      observed: observed[metric],
      deltaPercent: Number(deltaPercent.toFixed(2)),
      thresholdPercent: threshold,
      verdict: deltaPercent > threshold ? "FAIL" : deltaPercent > threshold * 0.75 ? "WARN" : "PASS",
    };
  });
  return comparisons;
};

async function processJob(jobId: string) {
  const job = await prisma.verificationJob.findUnique({ where: { id: jobId } });
  if (!job || job.status !== VerificationStatus.COLLECTING || !job.completedAt) return;

  await prisma.verificationJob.update({ where: { id: job.id }, data: { status: VerificationStatus.PROCESSING } });
  try {
    const [prMetrics, baselineSnapshot] = await Promise.all([
      prisma.metrics.findMany({
        where: { serviceId: job.serviceId, createdAt: { gte: job.createdAt, lte: job.completedAt } },
        select: { cpu: true, memory: true, latency: true, errors: true },
      }),
      job.baselineServiceId
        ? prisma.verificationBaseline.findFirst({
            where: { serviceId: job.baselineServiceId }, orderBy: { capturedAt: "desc" },
          })
        : Promise.resolve(null),
    ]);
    const observed = averageMetrics(prMetrics);
    const snapshotMetrics = baselineSnapshot?.metrics as Partial<MetricAverage> | undefined;
    let baseline = snapshotMetrics && Object.keys(DEFAULT_THRESHOLDS).every((key) => typeof snapshotMetrics[key as MetricKey] === "number")
      ? snapshotMetrics as MetricAverage
      : null;

    if (!baseline && job.baselineServiceId) {
      const historicalMetrics = await prisma.metrics.findMany({
        where: { serviceId: job.baselineServiceId, createdAt: { lt: job.createdAt } },
        orderBy: { createdAt: "desc" }, take: 200,
        select: { cpu: true, memory: true, latency: true, errors: true },
      });
      baseline = averageMetrics(historicalMetrics);
      if (baseline) {
        await prisma.verificationBaseline.create({
          data: {
            serviceId: job.baselineServiceId,
            metrics: baseline,
            sampleSize: historicalMetrics.length,
          },
        });
      }
    }

    if (!observed || !baseline) throw new Error("Insufficient PR telemetry or production baseline for comparison");
    const comparisons = buildComparison(baseline, observed, (job.thresholds as Record<string, unknown>) ?? {});
    const status = comparisons.some((comparison) => comparison.verdict === "FAIL")
      ? VerificationStatus.FAILED
      : comparisons.some((comparison) => comparison.verdict === "WARN")
        ? VerificationStatus.WARNING
        : VerificationStatus.PASSED;
    const analysis = await explainVerification(status, comparisons);
    const summary = `${status}: compared ${prMetrics.length} PR telemetry samples against a production baseline.`;

    await prisma.$transaction([
      prisma.verificationReport.create({
        data: { jobId: job.id, status, summary, comparisons, recommendations: analysis ?? undefined },
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
