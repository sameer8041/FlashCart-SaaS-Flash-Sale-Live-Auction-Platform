import "dotenv/config";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import mongoose from "mongoose";
import { prisma } from "../../lib/prisma";


const redis = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", { maxRetriesPerRequest: null });


// MongoDB Mongoose Setup
const productSchema = new mongoose.Schema({ stock: Number }, { strict: false });
const Product = mongoose.models.Product || mongoose.model("Product", productSchema);

async function startWorker() {
  // Connect to MongoDB
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log("👷‍♂️ [Worker] Connected to MongoDB");

  // Worker initialize karna (yeh 'orderQueue' naam ki line sune ga)
  const worker = new Worker("orderQueue", async (job) => {
    const { userId, productId, price } = job.data;
    console.log(`⏱️ Processing Job ${job.id} for Product ${productId}`);

    try {
      // ==========================================
      // 🚀 THE MAGIC: ATOMIC DECREMENT (No Race Condition)
      // ==========================================
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: productId, stock: { $gt: 0 } }, // Condition: ID match ho AUR stock 0 se bada ho
        { $inc: { stock: -1 } },               // Action: Stock me se 1 minus kar do
        { new: true }                          // Return: Updated document wapas karo
      );

      if (!updatedProduct) {
        // Agar stock 0 tha ya product nahi mila, toh yeh query fail ho jayegi
        console.log(`❌ Job ${job.id} Failed: Out of Stock!`);
        throw new Error("Out of Stock");
      }

      // ==========================================
      // 📦 SAVE TO POSTGRESQL (Transaction successful)
      // ==========================================
      await prisma.order.create({
        data: {
          userId,
          productId,
          price,
          status: "CONFIRMED",
        }
      });

      console.log(`✅ Job ${job.id} Success: Order Confirmed for User ${userId}`);
      return { success: true, message: "Order Confirmed" };

    } catch (error) {
      throw error; // BullMQ isko as failed job mark kar dega
    }
  }, { connection: redis });

  worker.on("completed", (job) => console.log(`🎉 Job ${job.id} has completed!`));
  worker.on("failed", (job, err) => console.log(`🚨 Job ${job?.id} has failed: ${err.message}`));
}

startWorker().catch(console.error);