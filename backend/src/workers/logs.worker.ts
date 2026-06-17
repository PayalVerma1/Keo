import { client } from "../config/redis.ts";
import { STREAMS } from "../streams/redis-streams.ts";
import * as logsService from "../modules/logs/logs.service.ts"
import { emitToService } from "../modules/websocket/socket.server.ts";
import { SOCKET_EVENTS } from "../modules/websocket/socket.events.ts";

const GROUP_NAME = "metrics-workers";
const CONSUMER_NAME = `metrics-consumer-${process.pid}`;

const ensureGroup = async () => {
  try {
    await client.sendCommand([
      "XGROUP",
      "CREATE",
      STREAMS.LOGS,
      GROUP_NAME,
      "0",
      "MKSTREAM",
    ]); //XGROUP CREATE give the command to create a group let's say department if the group already exists then redis will return BUSYGROUP
  } catch (error: any) {
    if (!String(error.message).includes("BUSYGROUP")) {
      throw error;
    }
  }
};
export const startMetricsWorker = async () => {
  await ensureGroup();
  while (true) {
    const res = await client.sendCommand([
      "XREADGROUP",
      "GROUP",
      GROUP_NAME,
      CONSUMER_NAME,
      "BLOCK",
      "500",
      "COUNT",
      "10",
      "STREAMS",
      STREAMS.LOGS,
      ">",
    ]);
    //">" this means give me only those mesages which are not assigned to any other worker
    if (!res) {
      continue;
    }
    const streams = res as unknown as any[];
    for (const [, messages] of streams) {
      for (const [messageID, fields] of messages) {
        try {
          const payloadIndex = fields.indexOf("payload");
          const payload = JSON.parse(fields[payloadIndex + 1]);
          const metric = await logsService.createLog(payload);

          emitToService(metric.serviceId, SOCKET_EVENTS.LOG_CREATED, metric);
          await client.sendCommand([
            "XACK",
            STREAMS.LOGS,
            GROUP_NAME,
            messageID,
          ]);
        } catch (err) {
          console.log("Failed to process metric event:", err);
        }
      }
    }
  }
};
