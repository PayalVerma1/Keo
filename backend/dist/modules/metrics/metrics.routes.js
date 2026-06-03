import { Router } from "express";
import { prisma } from "../../config/prisma.js";
const router = Router();
router.post("/metrics", async (req, res) => {
    try {
        const { cpu, memory, throughput, latency, errors, serviceId } = req.body;
        const metrics = await prisma.metrics.create({
            data: {
                cpu,
                memory,
                throughput,
                latency,
                errors,
                serviceId,
            },
        });
        res.status(201).json({
            message: "metrics created",
            metrics,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server error",
        });
    }
});
router.get("/services/:id/metrics", async (req, res) => {
    try {
        const metrics = await prisma.metrics.findMany({
            where: {
                serviceId: req.params.id,
            },
            orderBy: {
                createdAt: "asc",
            },
        });
        res.json(metrics);
    }
    catch (error) {
        res.status(500).json({
            message: "Failed to fetch metrics",
        });
    }
});
export default router;
