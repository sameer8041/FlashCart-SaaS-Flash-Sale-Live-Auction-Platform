import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";


// Tumhara Sprint 5 ka auth

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

        const dbUser = await prisma.user.findUnique({
            where: { email: session.user?.email as string }
        });

        if (!dbUser) {
            return NextResponse.json({ error: "User profile not found in database." }, { status: 404 });
        }

        const realUserId = dbUser.id; // Mil gaya real user ID!


        const body = await req.json();
        const { productId, price } = body; // Price hume DB se verify karna chahiye prod mein

        // 2. Razorpay options setup (Amount paise mein hota hai, isliye * 100)
        const options = {
            amount: price * 100,
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
            notes: {
                productId: productId,
                userId: realUserId
            },
        };

        // 3. Create Order in Razorpay
        const order = await razorpay.orders.create(options);


        const newOrder = await prisma.order.create({
            data: {
                userId: realUserId, // Agar auth nahi hai toh dummy ID
                productId: productId,
                amount: price,
                status: "PENDING",
                razorpayOrderId: order.id,// Razorpay ka order ID save kar liya
            }
        });


        return NextResponse.json(order, { status: 200 });
    } catch (error) {
        console.error("Razorpay Order Error:", error);
        return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }
}