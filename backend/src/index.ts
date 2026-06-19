import { app } from "./app.ts";
import { createServer } from "http";
import { initSocketServer } from "./modules/websocket/socket.server.ts";
import { connectRedis } from "./config/redis.ts";
import { startMetricsWorker } from "./workers/metrics.worker.ts";
import { startLogsWorker } from "./workers/logs.worker.ts";
import { startDeploymentWorker } from "./workers/deployment.worker.ts";
import { startAnomalyWorker } from "./workers/anomaly.worker.ts";
const port = process.env.PORT || 3000;

const server = createServer(app);

initSocketServer(server);
await connectRedis();
startMetricsWorker().catch((error) => {
  console.error("Metrics worker failed:", error);
});
startLogsWorker().catch((error) => {
  console.error("Logs worker failed:", error);
});
startDeploymentWorker().catch((error) => {
  console.error("Deployment worker failed:", error);
});
startAnomalyWorker().catch((error) => {
  console.error("Anomaly worker failed:", error);
});
server.listen(port, () => {
  console.log(`Server is running at port ${port}`);
});
