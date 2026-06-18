import { Request, Response } from "express";
import * as logsService from "./logs.service.ts";
import { publishLog } from "../../streams/producers.ts";
import {
  emitToService,
} from "../websocket/socket.server.ts";
import {
  SOCKET_EVENTS,
} from "../websocket/socket.events.ts";

export const createLog = async (
  req: Request,
  res: Response
) => {
  try {
   await publishLog(req.body);


    res.status(201).json({
      success: true,
      message:"log event queued",
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
