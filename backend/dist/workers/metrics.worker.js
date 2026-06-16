import { client } from "../config/redis.js";
import { STREAMS } from "../streams/redis-streams.js";
import * as metricsService from "../modules/metrics/metrics.service.js";
import { emitToService } from "../modules/websocket/socket.server.js";
import { SOCKET_EVENTS } from "../modules/websocket/socket.events.js";
const GROUP_NAME = "metrics-workers";
const CONSUMER_NAME = `metrics-consumer-${process.pid}`;
const ensureGroup = async () => {
    try {
        await client.sendCommand([
            "XGROUP",
            "CREATE",
            STREAMS.METRICS,
            GROUP_NAME,
            "0",
            "MKSTREAM",
        ]); //XGROUP CREATE give the command to create a group let's say department if the group already exists then redis will return BUSYGROUP 
    }
    catch (error) {
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
            STREAMS.METRICS,
            ">"
        ]);
        if (!res) {
            continue;
        }
        const streams = res;
        for (const [, messages] of streams) {
            for (const [messageID, fields] of messages) {
                try {
                    const payloadIndex = fields.indexOf("payload");
                    const payload = JSON.parse(fields[payloadIndex + 1]);
                    const metric = await metricsService.createMetric(payload);
                    emitToService(metric.serviceId, SOCKET_EVENTS.METRIC_CREATED, metric);
                    await client.sendCommand([
                        "XACK",
                        STREAMS.METRICS,
                        GROUP_NAME,
                        messageID,
                    ]);
                }
                catch (err) {
                    console.log("Failed to process metric event:", err);
                }
            }
        }
    }
};
