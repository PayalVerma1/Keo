import express from "express";
import authRoutes from "./modules/auth/auth.routes.js";
import deploymentRoutes from "./modules/deployments/deployment.routes.js";
import logsRoutes from "./modules/logs/logs.routes.js";
import metricsRoutes from "./modules/metrics/metrics.routes.js";
import serviceRoutes from "./modules/services/service.routes.js";
export const app = express();
app.use(express.json());
app.get("/", (req, res) => {
    res.send("Hello from backend");
});
app.use("/api/auth", authRoutes);
app.use("/api", serviceRoutes);
app.use("/api", metricsRoutes);
app.use("/api", logsRoutes);
app.use("/api", deploymentRoutes);
