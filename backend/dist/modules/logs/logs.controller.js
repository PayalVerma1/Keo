import * as logsService from "./logs.service.js";
export const createLog = async (req, res) => {
    try {
        const log = await logsService.createLog(req.body);
        res.status(201).json({
            success: true,
            log,
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
