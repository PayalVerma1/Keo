import { prisma } from "../config/prisma";
import { analyzeAnomaly } from "../modules/logs/log-analyzer.service";
import { emitToService } from "../modules/websocket/socket.server";
import { SOCKET_EVENTS } from "../modules/websocket/socket.events";

const CHECK_INTERVAL_MS = 10_000;
const LOOKBACK = 5 * 60 * 1000;

const triggeredServices = new Set<string>();

const getSeverity = (metric: {
  cpu: number;
  memory: number;
  latency: number;
  errors: number;
}) => {
  if (metric.cpu > 95 || metric.memory > 95 || metric.errors > 20)
    return "critical";
  if (
    metric.cpu > 85 ||
    metric.memory > 85 ||
    metric.latency > 1000 ||
    metric.errors > 5
  )
    return "warning";
  return null;
};

const buildReasons = (metric: {
  cpu: number;
  memory: number;
  latency: number;
  errors: number;
}) => {
  const reasons: string[] = [];
  if (metric.cpu > 85) reasons.push(`High CPU usage: ${metric.cpu}%`);
  if (metric.memory > 85) reasons.push(`High memory usage: ${metric.memory}%`);
  if (metric.latency > 1000) reasons.push(`High latency: ${metric.latency}ms`);
  if (metric.errors > 5) reasons.push(`Error spike: ${metric.errors} errors`);
  return reasons;
};

const checkAnomalies = async () => {
  const since = new Date(Date.now() - LOOKBACK);

  const metrics = await prisma.metrics.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: "desc" },
  });

  for (const metric of metrics) {
    const severity = getSeverity(metric);

    if (!severity) {
      triggeredServices.delete(metric.serviceId);
      continue;
    }

    if (triggeredServices.has(metric.serviceId)) continue;

    const logs = await prisma.logs.findMany({
      where: { serviceId: metric.serviceId, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const deployments = await prisma.deployment.findMany({
      where: { serviceId: metric.serviceId, createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    let analysis = null;
    try {
      analysis = await analyzeAnomaly(metric.serviceId, metric, logs, deployments);
    } catch (error) {
      console.error("AI anomaly analysis failed:", error);
    }

    let savedInsight = null;
    if (analysis) {
      savedInsight = await prisma.insight.create({
        data: {
          serviceId: metric.serviceId,
          severity: analysis.severity,
          rootCause: analysis.rootCause,
          recommendation: analysis.recommendation,
          metricContext: JSON.parse(JSON.stringify(metric)),
          logContext: JSON.parse(JSON.stringify(logs)),
        },
      });
    }

    const payload = {
      serviceId: metric.serviceId,
      severity,
      reasons: buildReasons(metric),
      metric,
      recentLogs: logs,
      recentDeployments: deployments,
      analysis,
      insight: savedInsight,
      detectedAt: new Date().toISOString(),
    };

    emitToService(metric.serviceId, SOCKET_EVENTS.ANOMALY_DETECTED, payload);
    triggeredServices.add(metric.serviceId);
  }
};

export const startAnomalyWorker = async () => {
  console.log("Anomaly worker started");
  while (true) {
    try {
      await checkAnomalies();
    } catch (error) {
      console.error("Failed to check anomalies:", error);
    }
    await new Promise((resolve) => setTimeout(resolve, CHECK_INTERVAL_MS));
  }
};
