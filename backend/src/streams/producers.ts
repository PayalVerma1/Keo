import { connectRedis } from "../config/redis.ts";
import {STREAMS} from "./redis-streams.ts";

type StreamPayLoad = Record<string,unknown>;

const addToStream = async(
    stream:string,
    payload:StreamPayLoad
)=>{
    return connectRedis.sendCommand([
        "XADD",
        stream,
        "MAXLEN",
        "~",
        "10000",
        "*",
        "payload",
        JSON.stringify(payload),
    ])
};
export const Metric = async(payload:StreamPayLoad)=>{
    return addToStream(STREAMS.METRICS,payload);
};
export const LOG = async(payload:StreamPayLoad)=>{
    return addToStream(STREAMS.LOGS, payload);
};

export const publishDeployment = async (payload: StreamPayLoad)=> {
  return addToStream(STREAMS.DEPLOYMENTS, payload);
};