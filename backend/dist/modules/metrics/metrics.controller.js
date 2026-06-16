import * as metricsService from "./metrics.service.js";
import { publishMetric } from "../../streams/producers.js";
export const createMetric = async (req, res) => {
    try {
        await publishMetric(req.body);
        res.status(202).json({
            success: true,
            message: "metrics created",
        });
    }
    catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};
export const getMetrics = async (req, res) => {
    try {
        const id = Array.isArray(req.params.id)
            ? req.params.id[0]
            : req.params.id ?? "";
        const metrics = await metricsService.getMetrics(id);
        res.status(200).json(metrics);
    }
    catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};
