import { Router } from "express";
import {
  createService,
} from "./service.controller.ts";

const router = Router();

router.post(
  "/services",
  createService
);

export default router;