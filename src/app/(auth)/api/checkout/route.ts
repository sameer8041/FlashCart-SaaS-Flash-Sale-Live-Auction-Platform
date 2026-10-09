
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/(auth)/api/auth/[...nextauth]/route";
import { orderQueue } from "@/lib/queue";
import { redis } from "@/lib/redis";

export async function POST(req: Request) {
    try {
        // 1. Check if user is logged in
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const userId = (session.user as any).id;

        // RATE LIMITING (1 request per 5 seconds per user)
        const rateLimitKey = `ratelimit:checkout:${userId}`;
        const isRateLimited = await redis.get(rateLimitKey);

        if (isRateLimited) {
            return NextResponse.json({ success: false, message: "Please wait 5 seconds before trying again" }, { status: 429 });
        }

        // 5 second ke liye flag set karo
        await redis.setex(rateLimitKey, 5, "locked");


        const body = await req.json();
        const { productId, price } = body;

        if (!productId) {
            return NextResponse.json({ success: false, message: "Product ID missing" }, { status: 400 });
        }

        // 2. Add job to Queue INSTEAD of hitting DB directly


        const job = await orderQueue.add("processOrder", {

            userId,
            productId,
            price,
            timestamp: Date.now(),
        }, {
            attempts: 1,
            removeOnComplete: false,
            removeOnFail: false
        });


        // 3. Turant frontend ko response de diya ki line me lag gaye ho
        return NextResponse.json({
            success: true,
            message: "Order placed in queue. Processing...",
            jobId: job.id
        });

    } catch (error) {
        console.error("[Checkout API] Error:", error);
        return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
    }
}