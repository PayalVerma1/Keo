import { prisma } from "../../config/prisma.ts";

export const createLog = async (
  data: {
    level: string;
    message: string;
    serviceId: string;
  }
) => {

  const log =
    await prisma.logs.create({
      data: {
        level: data.level,
        message: data.message,
        serviceId: data.serviceId,
      },
    });

  return log;
};

export const getLogs = async (
  serviceId: string
) => {

  const logs =
    await prisma.logs.findMany({
      where: {
        serviceId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

  return logs;
};