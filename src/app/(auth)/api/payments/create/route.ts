import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getServerSession } from "next-auth"; // Tumhara Sprint 5 ka auth

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: Request) {
    try {
        // 1. Session verify karo (Security)
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const { productId, price } = body; // Price hume DB se verify karna chahiye prod mein

        // 2. Razorpay options setup (Amount paise mein hota hai, isliye * 100)
        const options = {
            amount: price * 100,
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            notes: {
                productId: productId,
                userId: session.user?.email || "unknown", // Ideal: session.user.id
            },
        };

        // 3. Create Order in Razorpay
        const order = await razorpay.orders.create(options);

        return NextResponse.json(order, { status: 200 });
    } catch (error) {
        console.error("Razorpay Order Error:", error);
        return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }
}