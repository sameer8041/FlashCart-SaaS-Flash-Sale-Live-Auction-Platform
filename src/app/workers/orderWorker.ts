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

    let stockDecremented = false;

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

      stockDecremented = true;


      // ==========================================
      // 📦 SAVE TO POSTGRESQL (Transaction successful)
      // ==========================================
      await prisma.order.create({
        data: {
          userId,
          productId,
          price: updatedProduct.price,
          status: "CONFIRMED",
        }
      });


      // Targeted Cache Mutation (No Cache Drop)
      try {
        const cachedData = await redis.get("flashcart:products:all");

        if (cachedData) {
          let products = JSON.parse(cachedData);

          // Sirf us specific product ko dhoond kar uska stock minus karo
          products = products.map((p: any) => {
            if (p._id === productId && p.stock > 0) {
              const newStock = p.stock - 1;

              // 🚀 SPRINT 4 NEW: Redis Pub/Sub par live stock broadcast karo
              redis.publish("live-inventory", JSON.stringify({
                productId: productId,
                newStock: newStock
              }));

              return { ...p, stock: newStock };
            }



            return p;
          });

          // Wapas stringify karke Redis me save kar do (bina MongoDB ko hit kiye!)
          await redis.setex("flashcart:products:all", 3600, JSON.stringify(products));
          console.log(`🎯 Cache gracefully updated for Product ${productId}`);
        }
      } catch (cacheError) {
        console.error("Cache mutation failed, falling back to delete", cacheError);

        // Agar JSON parse fail ho jaye (rare case), toh as a fallback delete kar do
        await redis.del("flashcart:products:all");
      }


      console.log(`✅ Job ${job.id} Success: Order Confirmed for User ${userId}`);
      return { success: true, message: "Order Confirmed" };

    } catch (error) {
      // COMPENSATING TRANSACTION (Rollback)
      if (stockDecremented) {
        console.error(`Postgres failed! Reverting stock for Product ${productId}`);
        // Wapas +1 kar do
        await Product.updateOne({ _id: productId }, { $inc: { stock: 1 } });
      }
      throw error; // BullMQ isko as failed job mark karega
    }
  }, { connection: redis });

  worker.on("completed", (job) => console.log(`🎉 Job ${job.id} has completed!`));
  worker.on("failed", (job, err) => console.log(`🚨 Job ${job?.id} has failed: ${err.message}`));

  const gracefulShutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}, closing worker gracefully...`);
    // Naye jobs lena band karega, par chalte hue jobs pure karega
    await worker.close();
    // Redis connection safe close karega
    redis.quit();
    console.log('✅ Worker closed safely.');
    process.exit(0);
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))

}

startWorker().catch(console.error);


