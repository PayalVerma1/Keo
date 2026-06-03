import { Request, Response } from "express";
import * as logsService from "./logs.service.ts";

export const createLog = async (
  req: Request,
  res: Response
) => {
  try {
    const log =
      await logsService.createLog(
        req.body
      );

    res.status(201).json({
      success: true,
      log,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getLogs = async (
  req: Request,
  res: Response
) => {
  try {
    const logs =
      await logsService.getLogs(
        Array.isArray(req.params.serviceId) ? req.params.serviceId[0] : req.params.serviceId
      );

    res.status(200).json(logs);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};