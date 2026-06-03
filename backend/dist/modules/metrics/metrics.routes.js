import { Router } from "express";
import { createMetric, getMetrics, } from "./metrics.controller.js";
const router = Router();
router.post("/metrics", createMetric);
router.get("/services/:id/metrics", getMetrics);
export default router;
