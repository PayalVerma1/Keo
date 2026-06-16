import { app } from "./app.ts";
import { createServer } from "http";
import { initSocketServer } from "./modules/websocket/socket.server.ts";
import { connectRedis } from "./config/redis.ts";
import { startMetricsWorker } from "./workers/metrics.worker.ts";
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
