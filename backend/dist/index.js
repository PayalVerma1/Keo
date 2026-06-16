import { app } from "./app.js";
import { createServer } from "http";
import { initSocketServer } from "./modules/websocket/socket.server.js";
import { connectRedis } from "./config/redis.js";
import { startMetricsWorker } from "./workers/metrics.worker.js";
const port = process.env.PORT || 3000;
const server = createServer(app);
initSocketServer(server);
await connectRedis();
startMetricsWorker().catch((error) => {
    console.error("Metrics worker failed:", error);
});
server.listen(port, () => {
    console.log(`Server is running at port ${port}`);
});
