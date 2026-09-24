import { Prisma } from "@/lib/generated/prisma";
import { prisma } from "../../config/prisma";

export const createMetric = async (data: {
  cpu: number;
  memory: number;
  throughput: number;
  latency: number;
  errors: number;
  serviceId: string;
  verificationJobId?: string;
  routes?: unknown;
}) => {
  return prisma.metrics.create({
    data: {
      cpu: data.cpu,
      memory: data.memory,
      throughput: data.throughput,
      latency: data.latency,
      errors: data.errors,
      serviceId: data.serviceId,
      verificationJobId: data.verificationJobId,
      routes: data.routes === undefined ? undefined : (data.routes as Prisma.InputJsonValue),
    },
  });
};

export const getMetrics = async (serviceId: string) => {
  return prisma.metrics.findMany({
    where: { serviceId },
    orderBy: { createdAt: "asc" },
  });
};
