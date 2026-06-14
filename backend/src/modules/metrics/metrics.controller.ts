import { Request, Response } from "express";
import * as metricsService from "./metrics.service.ts";
import {
  emitToService,
} from "../websocket/socket.server.ts";
import {
  SOCKET_EVENTS,
} from "../websocket/socket.events.ts";

export const createMetric = async (
  req: Request,
  res: Response
) => {
  try {

    const metric =
      await metricsService.createMetric(
        req.body
      );

    emitToService(
      metric.serviceId,
      SOCKET_EVENTS.METRIC_CREATED,
      metric
    );

    res.status(201).json({
      message: "metrics created",
      metric,
    });

  } catch (error: any) {

    res.status(500).json({
      message: error.message,
    });

  }
};

export const getMetrics = async (
  req: Request,
  res: Response
) => {
  try {

    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : req.params.id ?? "";

    const metrics = await metricsService.getMetrics(id);

    res.status(200).json(metrics);

  } catch (error: any) {

    res.status(500).json({
      message: error.message,
    });

  }
};
