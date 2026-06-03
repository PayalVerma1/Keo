import { Request, Response } from "express";
import * as serviceService from "./service.service.ts";

export const createService = async (
  req: Request,
  res: Response
) => {
  try {

    const service =
      await serviceService.createService(
        req.body
      );

    res.status(201).json({
      message: "Service created",
      service,
    });

  } catch (error: any) {

    res.status(500).json({
      message: error.message,
    });

  }
};