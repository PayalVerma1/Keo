import { client } from "../config/redis";
import { STREAMS } from "../streams/redis-streams";
import * as metricsService from "../modules/metrics/metrics.service";
import { SOCKET_EVENTS } from "../modules/websocket/socket.events";
import { publishRealtimeEvent } from "../modules/websocket/realtime-bus";

const GROUP_NAME = "metrics-workers";
const CONSUMER_NAME = `metrics-consumer-${process.pid}`;

const ensureGroup = async () => {
  try {
    await client.xGroupCreate(STREAMS.METRICS, GROUP_NAME, "0", {
      MKSTREAM: true,
    });
  } catch (error: any) {
    // BUSYGROUP means group already exists — that's fine
    if (!String(error.message).includes("BUSYGROUP")) throw error;
  }
};

export const startMetricsWorker = async () => {
  await ensureGroup();
  console.log("Metrics worker started");

  while (true) {
    const res = await client.xReadGroup(
      GROUP_NAME,
      CONSUMER_NAME,
      [{ key: STREAMS.METRICS, id: ">" }],
      { COUNT: 10, BLOCK: 500 }
    );

    if (!res) continue;

    for (const { messages } of res) {
      for (const { id: messageID, message } of messages) {
        try {
          const payload = JSON.parse(message["payload"]);
          const metric = await metricsService.createMetric(payload);

          await publishRealtimeEvent(
            metric.serviceId,
            SOCKET_EVENTS.METRIC_CREATED,
            metric
          );

          await client.xAck(STREAMS.METRICS, GROUP_NAME, messageID);
        } catch (err) {
          console.error("Failed to process metric event:", err);
        }
      }
    }
  }
};
