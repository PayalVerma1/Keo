import * as deploymentService from "./deployment.service.js";
import { publishDeployment } from "../../streams/producers.js";
export const createDeployment = async (req, res) => {
    try {
        await publishDeployment(req.body);
        res.status(202).json({
            success: true,
            message: "deployment event queued",
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
export const getDeployments = async (req, res) => {
    try {
        const serviceId = Array.isArray(req.params.serviceId)
            ? req.params.serviceId[0]
            : req.params.serviceId;
        const deployments = await deploymentService.getDeployments(serviceId);
        res.status(200).json(deployments);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
