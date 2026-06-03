import { prisma } from "../../config/prisma.ts";

export const createMetric = async (
  data: {
    cpu: number;
    memory: number;
    throughput: number;
    latency: number;
    errors: number;
    serviceId: string;
  }
) => {

  const metric =
    await prisma.metrics.create({
      data: {
        cpu: data.cpu,
        memory: data.memory,
        throughput: data.throughput,
        latency: data.latency,
        errors: data.errors,
        serviceId: data.serviceId,
      },
    });

  return metric;
};

export const getMetrics = async (
  serviceId: string
) => {

  const metrics =
    await prisma.metrics.findMany({
      where: {
        serviceId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

  return metrics;
};