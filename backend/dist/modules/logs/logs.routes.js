import { Router } from "express";
import { prisma } from "../../config/prisma.js";
const router = Router();
router.post("/logs", async (req, res) => {
    try {
        const { level, message, serviceId } = req.body;
        const log = await prisma.logs.create({
            data: {
                level,
                message,
                serviceId,
            },
        });
        res.status(201).json({
            success: true,
            log,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to create log",
        });
    }
});
export default router;
