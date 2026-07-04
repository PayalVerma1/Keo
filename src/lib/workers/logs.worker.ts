import { client } from "../config/redis";
import { STREAMS } from "../streams/redis-streams";
import * as logsService from "../modules/logs/logs.service";
import { SOCKET_EVENTS } from "../modules/websocket/socket.events";
import { publishRealtimeEvent } from "../modules/websocket/realtime-bus";

const GROUP_NAME = "logs-workers";
const CONSUMER_NAME = `logs-consumer-${process.pid}`;

const ensureGroup = async () => {
  try {
    await client.xGroupCreate(STREAMS.LOGS, GROUP_NAME, "0", {
      MKSTREAM: true,
    });
  } catch (error: any) {
    if (!String(error.message).includes("BUSYGROUP")) throw error;
  }
};

export const startLogsWorker = async () => {
  await ensureGroup();
  console.log("Logs worker started");

  while (true) {
    const res = await client.xReadGroup(
      GROUP_NAME,
      CONSUMER_NAME,
      [{ key: STREAMS.LOGS, id: ">" }],
      { COUNT: 10, BLOCK: 500 }
    );

    if (!res) continue;

    for (const { messages } of res) {
      for (const { id: messageID, message } of messages) {
        try {
          const payload = JSON.parse(message["payload"]);
          const log = await logsService.createLog(payload);

          await publishRealtimeEvent(
            log.serviceId,
            SOCKET_EVENTS.LOG_CREATED,
            log
          );

          await client.xAck(STREAMS.LOGS, GROUP_NAME, messageID);
        } catch (err) {
          console.error("Failed to process log event:", err);
        }
      }
    }
  }
};
