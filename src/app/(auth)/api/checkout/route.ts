
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/(auth)/api/auth/[...nextauth]/route";
import { orderQueue } from "@/lib/queue";

export async function POST(req: Request) {
    try {
        // 1. Check if user is logged in
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { productId, price } = body;

        if (!productId) {
            return NextResponse.json({ success: false, message: "Product ID missing" }, { status: 400 });
        }

        // 2. Add job to Queue INSTEAD of hitting DB directly
        const userId = (session.user as any).id;

        const job = await orderQueue.add("processOrder", {
            userId,
            productId,
            price,
            timestamp: Date.now(),
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