import { loadEnvConfig } from "@next/env";
import { createServer } from "http";

loadEnvConfig(process.cwd());

const port = parseInt(process.env.PORT || process.env.WORKERS_PORT || "4001", 10);
const hostname = process.env.WORKERS_HOST || "0.0.0.0";

const startHealthServer = () => {
  const healthServer = createServer((_req, res) => {
    res.statusCode = 200;
    res.end("Workers are running");
  });

  healthServer.listen(port, hostname, () => {
    console.log(`Workers health server ready on http://${hostname}:${port}`);
  });
};

const startWorkers = async () => {
  const { connectRedis } = await import("../config/redis");
  const { startMetricsWorker } = await import("./metrics.worker");
  const { startLogsWorker } = await import("./logs.worker");
  const { startDeploymentWorker } = await import("./deployment.worker");
  const { startAnomalyWorker } = await import("./anomaly.worker");

  await connectRedis();
  startHealthServer();

  startMetricsWorker().catch((error) => {
    console.error("Metrics worker crashed:", error);
    process.exit(1);
  });

  startLogsWorker().catch((error) => {
    console.error("Logs worker crashed:", error);
    process.exit(1);
  });

  startDeploymentWorker().catch((error) => {
    console.error("Deployment worker crashed:", error);
    process.exit(1);
  });

  startAnomalyWorker().catch((error) => {
    console.error("Anomaly worker crashed:", error);
    process.exit(1);
  });
};

startWorkers().catch((error) => {
  console.error("Failed to start workers:", error);
  process.exit(1);
});
