import { Router } from "express";
import { prisma } from "../../config/prisma.js";
const router = Router();
router.post("/deployments", async (req, res) => {
    try {
        const { version, serviceId } = req.body;
        const deployment = await prisma.deployment.create({
            data: {
                version,
                serviceId,
            },
        });
        res.status(201).json({
            success: true,
            deployment,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to create deployment",
        });
    }
});
router.get("/deployments/:serviceId", async (req, res) => {
    try {
        const { serviceId } = req.params;
        const deployments = await prisma.deployment.findMany({
            where: {
                serviceId,
            },
            orderBy: {
                createdAt: "desc",
            },
        });
        res.status(200).json(deployments);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to fetch deployments",
        });
    }
});
export default router;
