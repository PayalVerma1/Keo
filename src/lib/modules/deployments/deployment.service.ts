import { prisma } from "../../config/prisma";

export const createDeployment = async (data: {
  version: string;
  serviceId: string;
}) => {
  return prisma.deployment.create({
    data: {
      version: data.version,
      serviceId: data.serviceId,
    },
  });
};

export const getDeployments = async (serviceId: string) => {
  return prisma.deployment.findMany({
    where: { serviceId },
    orderBy: { createdAt: "desc" },
  });
};
