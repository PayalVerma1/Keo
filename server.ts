import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, ".env.local") });
config({ path: resolve(__dirname, ".env") }); 

import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { initSocketServer } from "./src/lib/modules/websocket/socket.server";
import { connectRedis } from "./src/lib/config/redis";
import { startMetricsWorker } from "./src/lib/workers/metrics.worker";
import { startLogsWorker } from "./src/lib/workers/logs.worker";
import { startDeploymentWorker } from "./src/lib/workers/deployment.worker";
import { startAnomalyWorker } from "./src/lib/workers/anomaly.worker";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOST || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(async () => {
   await connectRedis();

  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  initSocketServer(httpServer);

  httpServer.listen(port, () => {
    console.log(`\n> Next.js + Socket.IO ready on http://${hostname}:${port}`);
    console.log(`> Mode: ${dev ? "development" : "production"}\n`);
  });

  startMetricsWorker().catch((err) => console.error("Metrics worker crashed:", err));
  startLogsWorker().catch((err) => console.error("Logs worker crashed:", err));
  startDeploymentWorker().catch((err) => console.error("Deployment worker crashed:", err));
  startAnomalyWorker().catch((err) => console.error("Anomaly worker crashed:", err));
});
