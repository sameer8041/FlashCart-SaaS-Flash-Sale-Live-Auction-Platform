
import { Queue } from "bullmq";
import { redis } from "@/lib/redis";


export const orderQueue = new Queue("orderQueue", {
    connection: redis,
    defaultJobOptions: {
        attempts: 3, // Agar order fail hua (jaise DB down), toh 3 baar retry karega
        backoff: {
            type: "exponential",
            delay: 1000, // Retry karne se pehle 1 second rukega
        },
        removeOnComplete: {
            age: 60,
        },
        removeOnFail: {
            age: 60,
        }
    }
});

export const checkoutQueue = new Queue("checkoutQueue", {
    connection: redis,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: "exponential",
            delay: 1000,
        },
        removeOnComplete: {
            age: 60,
        },
        removeOnFail: {
            age: 24 * 60 * 60, // 24 hours in seconds
        }
    }
});

console.log("[Queue] Order Queue initialized");