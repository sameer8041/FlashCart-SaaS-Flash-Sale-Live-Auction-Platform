export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { ProductService } from "@/Services/product.service";
import { redis } from "@/lib/redis";

export async function GET() {
    try {
        const products = await ProductService.getAllProducts();
        if (!products || products.length === 0) return NextResponse.json([], { status: 200 });

        // 🚀 REDIS PIPELINE: Fetch all live stocks in 1 single network request
        const pipeline = redis.pipeline();
        products.forEach((p: any) => {
            const pId = p._id ? p._id.toString() : p.id;
            pipeline.get(`stock:${pId}`);
        });
        const stockResults = await pipeline.exec();

        // Merge static DB data with Live Redis data
        const finalProducts = products.map((p: any, index: number) => {
            const liveStock = stockResults?.[index]?.[1];
            return {
                ...p,
                stock: liveStock !== null ? parseInt(liveStock as string, 10) : p.stock,
            };
        });

        return NextResponse.json(finalProducts, { status: 200 });
    } catch (error) {
        return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
    }
}