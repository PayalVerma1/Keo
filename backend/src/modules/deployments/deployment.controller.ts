import { Request, Response } from "express";
import * as deploymentService from "./deployment.service.ts";
import { publishDeployment } from "../../streams/producers.ts";

export const createDeployment = async (
  req: Request,
  res: Response
) => {
  try {
    await publishDeployment(req.body);

    res.status(202).json({
      success: true,
      message: "deployment event queued",
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getDeployments = async (
  req: Request,
  res: Response
) => {
  try {
    const serviceId = Array.isArray(req.params.serviceId)
      ? req.params.serviceId[0]
      : req.params.serviceId;

    const deployments = await deploymentService.getDeployments(
      serviceId as string
    );

    res.status(200).json(
      deployments
    );
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
