import { client } from "../../config/redis";

export const REALTIME_CHANNEL = "observability:realtime";

export type RealtimeMessage = {
  serviceId: string;
  event: string;
  payload: unknown;
};

export const publishRealtimeEvent = async (
  serviceId: string,
  event: string,
  payload: unknown
) => {
  await client.publish(
    REALTIME_CHANNEL,
    JSON.stringify({ serviceId, event, payload })
  );
};

export const subscribeRealtimeEvents = async (
  onMessage: (message: RealtimeMessage) => void
) => {
  const subscriber = client.duplicate();
  await subscriber.connect();

  await subscriber.subscribe(REALTIME_CHANNEL, (rawMessage) => {
    try {
      const message = JSON.parse(rawMessage) as RealtimeMessage;
      if (!message.serviceId || !message.event) return;
      onMessage(message);
    } catch (error) {
      console.error("Failed to parse realtime event:", error);
    }
  });

  return subscriber;
};
