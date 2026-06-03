import { prisma } from "../../config/prisma.ts";

export const createDeployment =
async (
  data: {
    version: string;
    serviceId: string;
  }
) => {

  const deployment =
    await prisma.deployment.create({
      data: {
        version: data.version,
        serviceId: data.serviceId,
      },
    });

  return deployment;
};

export const getDeployments =
async (
  serviceId: string
) => {

  const deployments =
    await prisma.deployment.findMany({
      where: {
        serviceId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

  return deployments;
};