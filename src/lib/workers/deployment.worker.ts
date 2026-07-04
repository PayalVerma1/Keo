import { client } from "../config/redis";
import { STREAMS } from "../streams/redis-streams";
import * as deploymentService from "../modules/deployments/deployment.service";
import { SOCKET_EVENTS } from "../modules/websocket/socket.events";
import { publishRealtimeEvent } from "../modules/websocket/realtime-bus";

const GROUP_NAME = "deployment-workers";
const CONSUMER_NAME = `deployment-consumer-${process.pid}`;

const ensureGroup = async () => {
  try {
    await client.xGroupCreate(STREAMS.DEPLOYMENTS, GROUP_NAME, "0", {
      MKSTREAM: true,
    });
  } catch (error: any) {
    if (!String(error.message).includes("BUSYGROUP")) throw error;
  }
};

export const startDeploymentWorker = async () => {
  await ensureGroup();
  console.log("Deployment worker started");

  while (true) {
    const res = await client.xReadGroup(
      GROUP_NAME,
      CONSUMER_NAME,
      [{ key: STREAMS.DEPLOYMENTS, id: ">" }],
      { COUNT: 10, BLOCK: 500 }
    );

    if (!res) continue;

    for (const { messages } of res) {
      for (const { id: messageID, message } of messages) {
        try {
          const payload = JSON.parse(message["payload"]);
          const deployment = await deploymentService.createDeployment(payload);

          await publishRealtimeEvent(
            deployment.serviceId,
            SOCKET_EVENTS.DEPLOYMENT_CREATED,
            deployment
          );

          await client.xAck(STREAMS.DEPLOYMENTS, GROUP_NAME, messageID);
        } catch (err) {
          console.error("Failed to process deployment event:", err);
        }
      }
    }
  }
};
