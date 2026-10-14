import "dotenv/config";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import mongoose from "mongoose";
import { prisma } from "../../lib/prisma";




const redis = new IORedis(process.env.REDIS_URL || "null", { maxRetriesPerRequest: null });


// MongoDB Mongoose Setup
const productSchema = new mongoose.Schema({ stock: Number }, { strict: false });
const Product = mongoose.models.Product || mongoose.model("Product", productSchema);


async function startWorker() {
  // Connect to MongoDB
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log("👷‍♂️ [Worker] Connected to MongoDB");
  console.log("worker is ready to perform")

  // Worker initialize karna (yeh 'orderQueue' naam ki line sune ga)
  const worker = new Worker("checkoutQueue", async (job) => {

    const { userId, productId, rzpPaymentId, rzpOrderId } = job.data;
    console.log(`⏱️ Processing Job ${job.id} for Product ${productId}`);




    let stockDecremented = false;


    try {

      let currentStock = await redis.decr(`stock:${productId}`);

      if (currentStock < 0) {
        await redis.incr(`stock:${productId}`); // Undo the fake decrement

        // Redis is unaware of stock. Let's fetch actual truth from MongoDB
        const dbProduct = await Product.findById(productId);

        if (!dbProduct || dbProduct.stock <= 0) {
          throw new Error("OUT OF STOCK");
        }

        // Heal Redis Cache
        await redis.set(`stock:${productId}`, dbProduct.stock);

        // Now safely decrement
        currentStock = await redis.decr(`stock:${productId}`);
      }




      // ==========================================
      // 🚀 THE MAGIC: ATOMIC DECREMENT (No Race Condition)
      // ==========================================
      const updatedProduct = await Product.findByIdAndUpdate(
        productId,
        { $inc: { stock: -1 } },
        { new: true }
      );

      if (!updatedProduct) throw new Error("DB UPDATE FAILED");

      stockDecremented = true;


      // ==========================================
      // 📦 SAVE TO POSTGRESQL (Transaction successful)
      // ==========================================


      await prisma.order.update({
        where: { razorpayOrderId: rzpOrderId },
        data: {
          status: "COMPLETED",
          razorpayPaymentId: rzpPaymentId,
        }
      });
      console.log(" order created in postgres")


      redis.publish("live-inventory", JSON.stringify({
        productId: productId,
        newStock: currentStock // Updated stock directly from Redis 
      }));

      console.log(`✅ Job ${job.id} Success: Order Confirmed for User ${userId}`)
      return { success: true, message: "Order Confirmed" }





    } catch (error) {
      // ==========================================
      // 🔄 COMPENSATING TRANSACTION (Rollback)
      // ==========================================
      console.error("Transaction failed! Initiating rollback...", error);

      if (stockDecremented) {
        await Product.findByIdAndUpdate(productId, { $inc: { stock: 1 } });
      }
      // Return stock to Redis as well
      await redis.incr(`stock:${productId}`);

      throw error;// BullMQ isko failed job mark karega[cite: 5]
    }
  }, { connection: redis })

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


