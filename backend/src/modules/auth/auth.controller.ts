import { Request, Response } from "express";
import * as authService from "./auth.service.ts";

export const register = async (
  req: Request,
  res: Response
) => {
  try {
    const user =
      await authService.register(
        req.body
      );

    res.status(201).json({
      message:
        "User created successfully",
      user,
    });
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
};

export const login = async (
  req: Request,
  res: Response
) => {
  try {
    const result =
      await authService.login(
        req.body
      );

    res.json(result);
  } catch (error: any) {
    res.status(400).json({
      message: error.message,
    });
  }
};