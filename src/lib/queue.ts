
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

console.log("[Queue] Order Queue initialized");