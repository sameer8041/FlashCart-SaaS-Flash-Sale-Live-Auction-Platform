// src/app/api/seed/products/route.ts
import { NextResponse } from "next/server";
import { connectToMongoDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import { redis } from "@/lib/redis";

export async function GET() {
    try {
        await connectToMongoDB();

        // 1. Purane dummy products delete kar do (testing ke liye clean slate)
        await Product.deleteMany({});

        // 2. Naye dummy products ka data
        const dummyProducts = [
            {
                name: "Nike Air Jordan 1 Retro",
                description: "Limited Edition High-Top Sneakers. Extremely rare.",
                price: 15999,
                stock: 5, // Dhyan do, stock sirf 5 hai (Sprint 3 me race condition ke kaam aayega)
                images: ["https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=500&auto=format&fit=crop"],
                category: "Sneakers",
                isFlashSale: true,
            },
            {
                name: "Sony PlayStation 5 Pro",
                description: "Next-gen gaming console with 2TB SSD.",
                price: 49990,
                stock: 2, // Sirf 2 bache hain
                images: ["https://images.unsplash.com/photo-1606813907291-d86efa9b94db?q=80&w=500&auto=format&fit=crop"],
                category: "Electronics",
                isFlashSale: true,
            },
            {
                name: "Coldplay Concert VIP Ticket",
                description: "Front row VIP access for the upcoming tour.",
                price: 25000,
                stock: 50,
                images: ["https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=500&auto=format&fit=crop"],
                category: "Events",
                isFlashSale: true,
            }
        ];

        // 3. MongoDB me insert karo
        await Product.insertMany(dummyProducts);

        // 4. CACHE INVALIDATION: Redis se purana data hatao taki naya data dikhe
        await redis.del("flashcart:products:all");

        return NextResponse.json({
            success: true,
            message: "Products seeded and cache cleared successfully!"
        });
    } catch (error) {
        console.error("Seeding Error:", error);
        return NextResponse.json({ success: false, message: "Error seeding database" }, { status: 500 });
    }
}