import { loadEnvConfig } from "@next/env";
import { createServer } from "http";

loadEnvConfig(process.cwd());

const port = parseInt(process.env.SOCKET_PORT || "4000", 10);
const hostname = process.env.SOCKET_HOST || "localhost";

const startSocketServer = async () => {
  const { connectRedis } = await import("./src/lib/config/redis");
  const { initSocketServer } = await import("./src/lib/modules/websocket/socket.server");

  await connectRedis();

  const httpServer = createServer((_req, res) => {
    res.statusCode = 200;
    res.end("Socket.IO server is running");
  });

  initSocketServer(httpServer);

  httpServer.once("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Socket port ${port} is already in use.`);
      process.exit(1);
    }

    throw error;
  });

  httpServer.listen(port, hostname, () => {
    console.log(`Socket.IO server ready on http://${hostname}:${port}`);
  });
};

startSocketServer().catch((error) => {
  console.error("Failed to start Socket.IO server:", error);
  process.exit(1);
});
