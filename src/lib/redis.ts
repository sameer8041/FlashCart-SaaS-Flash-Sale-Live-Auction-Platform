
import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

// Singleton pattern for Redis
const globalForRedis = global as unknown as { redis: Redis };

export const redis =
    globalForRedis.redis ||
    new Redis(redisUrl, {
        maxRetriesPerRequest: null,
    });

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

redis.on("connect", () => console.log("[Redis] Connected successfully"));
redis.on("error", (err) => console.error("[Redis] Error:", err));