import { prisma } from "../../config/prisma.js";
export const createMetric = async (data) => {
    const metric = await prisma.metrics.create({
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
export const getMetrics = async (serviceId) => {
    const metrics = await prisma.metrics.findMany({
        where: {
            serviceId,
        },
        orderBy: {
            createdAt: "asc",
        },
    });
    return metrics;
};
