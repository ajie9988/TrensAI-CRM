import { createClient } from "redis";
import { logger } from "../utils/logger";

let redisClient: any;

export async function createRedisClient() {
  if (redisClient) return redisClient;

  const redisUrl = process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || "localhost"}:${process.env.REDIS_PORT || "6379"}`;

  redisClient = createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy: false,
    },
  });

  try {
    await redisClient.connect();
    logger.info("✅ Redis connected");
    return redisClient;
  } catch (error) {
    logger.warn("Redis unavailable, continuing without cache");
    redisClient = null;
    return null;
  }
}

export { redisClient };
