import { Request, Response } from "express";
import * as deploymentService from "./deployment.service.ts";
import {
  emitToService,
} from "../websocket/socket.server.ts";
import {
  SOCKET_EVENTS,
} from "../websocket/socket.events.ts";

export const createDeployment = async (
  req: Request,
  res: Response
) => {
  try {
    const deployment =
      await deploymentService.createDeployment(
        req.body
      );

    emitToService(
      deployment.serviceId,
      SOCKET_EVENTS.DEPLOYMENT_CREATED,
      deployment
    );

    res.status(201).json({
      success: true,
      deployment,
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
