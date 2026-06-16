import { Request, Response } from "express";
import * as metricsService from "./metrics.service.ts";
import { publishMetric } from "../../streams/producers.ts";

export const createMetric = async (
  req: Request,
  res: Response
) => {
  try {

   await publishMetric(req.body)

    res.status(202).json({
      success:true,
      message: "metrics created",
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
