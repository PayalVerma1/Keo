import { createClient } from "redis";

const globalForRedis = global as unknown as { redisClient: ReturnType<typeof createClient> };

export const client =
  globalForRedis.redisClient ||
  createClient({
    url: process.env.REDIS_CLIENT,
  });

client.on("error", (err) => {
  console.error("Redis client error:", err);
});

export const connectRedis = async () => {
  if (!client.isOpen) {
    await client.connect();
    console.log("Redis connected");
  }
};

if (process.env.NODE_ENV !== "production") globalForRedis.redisClient = client;
