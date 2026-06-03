import { prisma } from "../../config/prisma.js";
export const createService = async (data) => {
    const existingService = await prisma.service.findFirst({
        where: {
            name: data.name,
            ownerID: data.ownerID,
        },
    });
    if (existingService) {
        throw new Error("Service already exists");
    }
    const service = await prisma.service.create({
        data: {
            name: data.name,
            description: data.description,
            ownerID: data.ownerID,
        },
    });
    return service;
};
