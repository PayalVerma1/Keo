import { client } from "../config/redis.js";
import { STREAMS } from "../streams/redis-streams.js";
import * as logsService from "../modules/logs/logs.service.js";
import { emitToService } from "../modules/websocket/socket.server.js";
import { SOCKET_EVENTS } from "../modules/websocket/socket.events.js";
const GROUP_NAME = "logs-workers";
const CONSUMER_NAME = `logs-consumer-${process.pid}`;
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
    }
    catch (error) {
        if (!String(error.message).includes("BUSYGROUP")) {
            throw error;
        }
    }
};
export const startLogsWorker = async () => {
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
        const streams = res;
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
                }
                catch (err) {
                    console.log("Failed to process log event:", err);
                }
            }
        }
    }
};
