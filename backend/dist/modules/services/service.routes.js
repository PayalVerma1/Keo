import { Router } from "express";
import { createService, } from "./service.controller.js";
const router = Router();
router.post("/services", createService);
export default router;
