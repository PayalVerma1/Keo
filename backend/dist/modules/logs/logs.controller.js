import * as logsService from "./logs.service.js";
import { publishLog } from "../../streams/producers.js";
export const createLog = async (req, res) => {
    try {
        await publishLog(req.body);
        res.status(202).json({
            success: true,
            message: "log event queued",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
export const getLogs = async (req, res) => {
    try {
        const logs = await logsService.getLogs(Array.isArray(req.params.serviceId) ? req.params.serviceId[0] : req.params.serviceId);
        res.status(200).json(logs);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
