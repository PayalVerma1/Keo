import * as serviceService from "./service.service.js";
export const createService = async (req, res) => {
    try {
        const service = await serviceService.createService(req.body);
        res.status(201).json({
            message: "Service created",
            service,
        });
    }
    catch (error) {
        res.status(500).json({
            message: error.message,
        });
    }
};
