import { client, connectRedis } from "../config/redis";
import { STREAMS } from "./redis-streams";

type StreamPayload = Record<string, unknown>;

const addToStream = async (stream: string, payload: StreamPayload) => {
  await connectRedis();
  return client.sendCommand([
    "XADD",
    stream,
    "MAXLEN",
    "~",
    "10000",
    "*",
    "payload",
    JSON.stringify(payload),
  ]);
};

export const publishMetric = async (payload: StreamPayload) => {
  return addToStream(STREAMS.METRICS, payload);
};

export const publishLog = async (payload: StreamPayload) => {
  return addToStream(STREAMS.LOGS, payload);
};

export const publishDeployment = async (payload: StreamPayload) => {
  return addToStream(STREAMS.DEPLOYMENTS, payload);
};
