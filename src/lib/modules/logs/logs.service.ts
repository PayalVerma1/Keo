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

export const getLogs = async (serviceId: string) => {
  return prisma.logs.findMany({
    where: { serviceId },
    orderBy: { createdAt: "desc" },
  });
};
