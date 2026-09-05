import { prisma } from "../../config/prisma";

export const createLog = async (data: {
  level: string;
  message: string;
  serviceId: string;
}) => {
  return prisma.logs.create({
    data: {
      level: data.level,
      message: data.message,
      serviceId: data.serviceId,
    },
  });
};

export const getLogs = async (serviceId: string, limit = 100) => {
  return prisma.logs.findMany({
    where: { serviceId },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 200),
  });
};

export const getRecentLogs = async (serviceIds: string[], limit = 80) => {
  if (serviceIds.length === 0) return [];

  return prisma.logs.findMany({
    where: { serviceId: { in: serviceIds } },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 200),
    include: { service: { select: { name: true } } },
  });
};
