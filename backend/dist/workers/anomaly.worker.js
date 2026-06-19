import { prisma } from "../config/prisma.js";
import { emitToService } from "../modules/websocket/socket.server.js";
import { SOCKET_EVENTS } from "../modules/websocket/socket.events.js";
const CHECK_INTERVAL_MS = 10_000;
const LOOKBACK_MS = 5 * 60 * 1000;
const triggeredServices = new Set();
const getSeverity = (metric) => {
    if (metric.cpu > 95 || metric.memory > 95 || metric.errors > 20) {
        return "critical";
    }
    if (metric.cpu > 85 || metric.memory > 85 || metric.latency > 1000 || metric.errors > 5) {
        return "warning";
    }
    return null;
};
const buildReasons = (metric) => {
    const reasons = [];
    if (metric.cpu > 85)
        reasons.push(`High CPU usage: ${metric.cpu}%`);
    if (metric.memory > 85)
        reasons.push(`High memory usage: ${metric.memory}%`);
    if (metric.latency > 1000)
        reasons.push(`High latency: ${metric.latency}ms`);
    if (metric.errors > 5)
        reasons.push(`Error spike: ${metric.errors} errors`);
    return reasons;
};
const checkAnomalies = async () => {
    const since = new Date(Date.now() - LOOKBACK_MS);
    const metrics = await prisma.metrics.findMany({
        where: {
            createdAt: {
                gte: since,
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });
    for (const metric of metrics) {
        const severity = getSeverity(metric);
        if (!severity) {
            triggeredServices.delete(metric.serviceId);
            continue;
        }
        if (triggeredServices.has(metric.serviceId)) {
            continue;
        }
        const logs = await prisma.logs.findMany({
            where: {
                serviceId: metric.serviceId,
                createdAt: {
                    gte: since,
                },
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 10,
        });
        const payload = {
            serviceId: metric.serviceId,
            severity,
            reasons: buildReasons(metric),
            metric,
            recentLogs: logs,
            detectedAt: new Date().toISOString(),
        };
        emitToService(metric.serviceId, SOCKET_EVENTS.ANOMALY_DETECTED, payload);
        triggeredServices.add(metric.serviceId);
    }
};
export const startAnomalyWorker = async () => {
    while (true) {
        try {
            await checkAnomalies();
        }
        catch (error) {
            console.log("Failed to check anomalies:", error);
        }
        await new Promise((resolve) => setTimeout(resolve, CHECK_INTERVAL_MS));
    }
};
