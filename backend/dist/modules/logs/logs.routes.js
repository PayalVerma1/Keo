import { Router } from "express";
import { createLog, getLogs, } from "./logs.controller.js";
const router = Router();
router.post("/logs", createLog);
router.get("/logs/:serviceId", getLogs);
export default router;
