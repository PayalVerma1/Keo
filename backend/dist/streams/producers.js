import { client } from "../config/redis.js";
import { STREAMS } from "./redis-streams.js";
const addToStream = async (stream, payload) => {
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
export const publishMetric = async (payload) => {
    return addToStream(STREAMS.METRICS, payload);
};
export const publishLog = async (payload) => {
    return addToStream(STREAMS.LOGS, payload);
};
export const publishDeployment = async (payload) => {
    return addToStream(STREAMS.DEPLOYMENTS, payload);
};
