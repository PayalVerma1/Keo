import * as metricsService from "./metrics.service.js";
import { emitToService, } from "../websocket/socket.server.js";
import { SOCKET_EVENTS, } from "../websocket/socket.events.js";
export const createMetric = async (req, res) => {
    try {
        const metric = await metricsService.createMetric(req.body);
        emitToService(metric.serviceId, SOCKET_EVENTS.METRIC_CREATED, metric);
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
