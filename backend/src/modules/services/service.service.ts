import { prisma } from "../../config/prisma.ts";

export const createService = async (
  data: {
    name: string;
    description?: string;
    ownerID: string;
  }
) => {

  const existingService =
    await prisma.service.findFirst({
      where: {
        name: data.name,
        ownerID: data.ownerID,
      },
    });

  if (existingService) {
    throw new Error(
      "Service already exists"
    );
  }

  const service =
    await prisma.service.create({
      data: {
        name: data.name,
        description: data.description,
        ownerID: data.ownerID,
      },
    });

  return service;
};