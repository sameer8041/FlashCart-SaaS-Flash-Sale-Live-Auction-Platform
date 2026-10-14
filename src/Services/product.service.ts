
import { connectToMongoDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import { redis } from "@/lib/redis";

export class ProductService {

    static async getAllProducts() {
        const cacheKey = "flashcart:products:all";


        try {
            // 1. Check Redis Cache First
            const cachedProducts = await redis.get(cacheKey);

            if (cachedProducts) {
                console.log("⚡ [Cache HIT] Returning products from Redis");
                return JSON.parse(cachedProducts);
            }

            // 2. Cache Miss - Fetch from MongoDB
            console.log("🐌 [Cache MISS] Fetching from MongoDB");
            await connectToMongoDB();

            // Lean() use kar rahe hain taki Mongoose object ki jagah plain JSON mile (faster)
            const products = await Product.find({ stock: { $gt: 0 } })
                .sort({ createdAt: -1 })
                .lean();


            // 3. Save to Redis for next requests (Expiry set to 1 hour / 3600 seconds)
            await redis.setex(cacheKey, 3600, JSON.stringify(products));

            return products;
        } catch (error) {
            console.error("[ProductService] Error:", error);
            throw new Error("Could not fetch products");
        }
    }
}