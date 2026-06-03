import { prisma } from "../../config/prisma.js";
export const createDeployment = async (data) => {
    const deployment = await prisma.deployment.create({
        data: {
            version: data.version,
            serviceId: data.serviceId,
        },
    });
    return deployment;
};
export const getDeployments = async (serviceId) => {
    const deployments = await prisma.deployment.findMany({
        where: {
            serviceId,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
    return deployments;
};
