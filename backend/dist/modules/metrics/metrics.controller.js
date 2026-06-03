import * as metricsService from "./metrics.service.js";
export const createMetric = async (req, res) => {
    try {
        const metric = await metricsService.createMetric(req.body);
        res.status(201).json({
            message: "metrics created",
            metric,
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
