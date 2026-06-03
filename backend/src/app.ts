import express from "express";

import authRoutes from "./modules/auth/auth.routes.ts";
import deploymentRoutes from "./modules/deployments/deployment.routes.ts";
import logsRoutes from "./modules/logs/logs.routes.ts";
import metricsRoutes from "./modules/metrics/metrics.routes.ts";
import serviceRoutes from "./modules/services/service.routes.ts";

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
