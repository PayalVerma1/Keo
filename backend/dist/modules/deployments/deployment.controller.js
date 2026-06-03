import * as deploymentService from "./deployment.service.js";
export const createDeployment = async (req, res) => {
    try {
        const deployment = await deploymentService.createDeployment(req.body);
        res.status(201).json({
            success: true,
            deployment,
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
