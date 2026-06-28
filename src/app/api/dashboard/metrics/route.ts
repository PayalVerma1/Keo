import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/middleware/auth";
import { prisma } from "@/lib/config/prisma";

export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if ("error" in auth) return auth.error;

  try {
    const userId = auth.payload.id;

    // Get all services owned by this user
    const services = await prisma.service.findMany({
      where: { ownerID: userId },
      select: { id: true, name: true },
    });

    if (services.length === 0) {
      return NextResponse.json({
        cpu: [],
        memory: [],
        latency: [],
        errors: [],
        summary: {
          totalServices: 0,
          activeAlerts: 0,
          avgLatency: 0,
          errorRate: 0,
        },
      });
    }

    const serviceIds = services.map((s) => s.id);

    // Fetch recent metrics for all services (last 30 data points)
    const metrics = await prisma.metrics.findMany({
      where: { serviceId: { in: serviceIds } },
      orderBy: { createdAt: "asc" },
      take: 120, // fetch more and we'll aggregate
    });

    // Aggregate metrics across all services by grouping into 8 time buckets
    const buildChartData = (
      key: "cpu" | "memory" | "latency" | "errors",
      points = 8
    ) => {
      if (metrics.length === 0) return [];

      const bucketSize = Math.max(1, Math.ceil(metrics.length / points));
      const buckets: number[][] = Array.from({ length: points }, () => []);

      metrics.forEach((m, index) => {
        const bucketIndex = Math.min(
          Math.floor(index / bucketSize),
          points - 1
        );
        buckets[bucketIndex].push(m[key]);
      });

      return buckets.map((bucket, i) => ({
        time: `-${(points - i) * 4}m`,
        value:
          bucket.length > 0
            ? parseFloat(
                (bucket.reduce((a, b) => a + b, 0) / bucket.length).toFixed(2)
              )
            : 0,
      }));
    };

    // Summary stats
    const recentMetrics = metrics.slice(-10);
    const avgLatency =
      recentMetrics.length > 0
        ? parseFloat(
            (
              recentMetrics.reduce((s, m) => s + m.latency, 0) /
              recentMetrics.length
            ).toFixed(0)
          )
        : 0;

    const avgErrors =
      recentMetrics.length > 0
        ? parseFloat(
            (
              recentMetrics.reduce((s, m) => s + m.errors, 0) /
              recentMetrics.length
            ).toFixed(2)
          )
        : 0;

    // Count active alerts (services with high CPU > 80 or errors > 5)
    const latestMetricPerService = await prisma.metrics.findMany({
      where: { serviceId: { in: serviceIds } },
      orderBy: { createdAt: "desc" },
      distinct: ["serviceId"],
    });

    const activeAlerts = latestMetricPerService.filter(
      (m) => m.cpu > 80 || m.errors > 5
    ).length;

    return NextResponse.json({
      cpu: buildChartData("cpu"),
      memory: buildChartData("memory"),
      latency: buildChartData("latency"),
      errors: buildChartData("errors"),
      summary: {
        totalServices: services.length,
        activeAlerts,
        avgLatency: `${avgLatency}ms`,
        errorRate: `${avgErrors}%`,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
