import { prisma } from "../../config/prisma.js";
export const createLog = async (data) => {
    const log = await prisma.logs.create({
        data: {
            level: data.level,
            message: data.message,
            serviceId: data.serviceId,
        },
    });
    return log;
};
export const getLogs = async (serviceId) => {
    const logs = await prisma.logs.findMany({
        where: {
            serviceId,
        },
        orderBy: {
            createdAt: "desc",
        },
    });
    return logs;
};
