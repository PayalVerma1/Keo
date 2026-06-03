import { Router } from "express";
import { createDeployment, getDeployments, } from "./deployment.controller.js";
const router = Router();
router.post("/deployments", createDeployment);
router.get("/deployments/:serviceId", getDeployments);
export default router;
