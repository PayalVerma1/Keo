import { app } from "./app.js";
import { createServer } from "http";
import { initSocketServer } from "./modules/websocket/socket.server.js";
import { connectRedis } from "./config/redis.js";
import { startMetricsWorker } from "./workers/metrics.worker.js";
import { startLogsWorker } from "./workers/logs.worker.js";
import { startDeploymentWorker } from "./workers/deployment.worker.js";
import { startAnomalyWorker } from "./workers/anomaly.worker.js";
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
