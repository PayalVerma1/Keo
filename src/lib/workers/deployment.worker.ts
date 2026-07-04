import { client } from "../config/redis";
import { STREAMS } from "../streams/redis-streams";
import * as deploymentService from "../modules/deployments/deployment.service";
import { SOCKET_EVENTS } from "../modules/websocket/socket.events";
import { publishRealtimeEvent } from "../modules/websocket/realtime-bus";

const GROUP_NAME = "deployment-workers";
const CONSUMER_NAME = `deployment-consumer-${process.pid}`;

const ensureGroup = async () => {
  try {
    await client.sendCommand([
      "XGROUP", "CREATE", STREAMS.DEPLOYMENTS, GROUP_NAME, "0", "MKSTREAM",
    ]);
  } catch (error: any) {
    if (!String(error.message).includes("BUSYGROUP")) throw error;
  }
};

export const startDeploymentWorker = async () => {
  await ensureGroup();
  console.log("Deployment worker started");

  while (true) {
    const res = await client.sendCommand([
      "XREADGROUP", "GROUP", GROUP_NAME, CONSUMER_NAME,
      "BLOCK", "500", "COUNT", "10",
      "STREAMS", STREAMS.DEPLOYMENTS, ">",
    ]);

    if (!res) continue;

    // redis v4 returns XREADGROUP as a Map<streamName, [id, fields[]][]>
    const streamMap = res as unknown as Map<string, [string, string[]][]>;
    for (const [, messages] of streamMap.entries()) {
      if (!messages) continue;
      for (const [messageID, fields] of messages) {
        try {
          const payloadIndex = (fields as string[]).indexOf("payload");
          const payload = JSON.parse((fields as string[])[payloadIndex + 1]);
          const deployment = await deploymentService.createDeployment(payload);

          await publishRealtimeEvent(
            deployment.serviceId,
            SOCKET_EVENTS.DEPLOYMENT_CREATED,
            deployment
          );

          await client.sendCommand([
            "XACK", STREAMS.DEPLOYMENTS, GROUP_NAME, messageID,
          ]);
        } catch (err) {
          console.error("Failed to process deployment event:", err);
        }
      }
    }
  }
};
