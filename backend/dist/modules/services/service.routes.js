import { Router } from "express";
import { prisma } from "../../config/prisma.js";
const router = Router();
router.post("/services", async (req, res) => {
    try {
        const { name, description, ownerID } = req.body;
        const existingservice = await prisma.service.findFirst({
            where: {
                name,
                ownerID,
            },
        });
        if (existingservice) {
            return res.status(400).json({
                message: "Service already exists",
            });
        }
        const service = await prisma.service.create({
            data: {
                name,
                description,
                ownerID,
            },
        });
        res.status(201).json({
            message: "Service created",
            service,
        });
    }
    catch (error) {
        res.status(500).json({
            message: "Internal Server Error",
        });
    }
});
export default router;
