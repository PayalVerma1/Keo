import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

const startWorkers = async () => {
  const { connectRedis } = await import("../config/redis");
  const { startMetricsWorker } = await import("./metrics.worker");
  const { startLogsWorker } = await import("./logs.worker");
  const { startDeploymentWorker } = await import("./deployment.worker");
  const { startAnomalyWorker } = await import("./anomaly.worker");

  await connectRedis();

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
