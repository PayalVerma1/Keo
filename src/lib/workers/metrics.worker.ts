import { client } from "../config/redis";
import { STREAMS } from "../streams/redis-streams";
import * as metricsService from "../modules/metrics/metrics.service";
import { emitToService } from "../modules/websocket/socket.server";
import { SOCKET_EVENTS } from "../modules/websocket/socket.events";

const GROUP_NAME = "metrics-workers";
const CONSUMER_NAME = `metrics-consumer-${process.pid}`;

const ensureGroup = async () => {
  try {
    await client.sendCommand([
      "XGROUP", "CREATE", STREAMS.METRICS, GROUP_NAME, "0", "MKSTREAM",
    ]);
  } catch (error: any) {
    if (!String(error.message).includes("BUSYGROUP")) throw error;
  }
};

export const startMetricsWorker = async () => {
  await ensureGroup();
  console.log("Metrics worker started");

  while (true) {
    const res = await client.sendCommand([
      "XREADGROUP", "GROUP", GROUP_NAME, CONSUMER_NAME,
      "BLOCK", "500", "COUNT", "10",
      "STREAMS", STREAMS.METRICS, ">",
    ]);

    if (!res) continue;

    const streams = res as unknown as any[];
    for (const [, messages] of streams) {
      for (const [messageID, fields] of messages) {
        try {
          const payloadIndex = (fields as string[]).indexOf("payload");
          const payload = JSON.parse((fields as string[])[payloadIndex + 1]);
          const metric = await metricsService.createMetric(payload);

          emitToService(metric.serviceId, SOCKET_EVENTS.METRIC_CREATED, metric);

          await client.sendCommand([
            "XACK", STREAMS.METRICS, GROUP_NAME, messageID,
          ]);
        } catch (err) {
          console.error("Failed to process metric event:", err);
        }
      }
    }
  }
};
