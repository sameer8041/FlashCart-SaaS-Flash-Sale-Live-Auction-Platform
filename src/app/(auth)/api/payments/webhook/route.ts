// src/app/api/payments/webhook/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
//  BullMQ queue import 
import { checkoutQueue } from "@/lib/queue";

export async function POST(req: Request) {
    try {
        // Raw body read karna zaroori hai signature verification ke liye
        const rawBody = await req.text();
        const signature = req.headers.get("x-razorpay-signature");
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;

        if (!signature) {
            return NextResponse.json({ error: "No signature found" }, { status: 400 });
        }

        //  Generate HMAC SHA256 Signature
        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(rawBody)
            .digest("hex");

        //  Verify Razorpay Signature (Security Check)
        if (expectedSignature !== signature) {
            console.error("🚨 Invalid Webhook Signature!");
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }

        //  Parse the verified payload
        const data = JSON.parse(rawBody);

        //  Handle the payment success event
        if (data.event === "payment.captured" || data.event === "order.paid") {
            const paymentEntity = data.payload.payment.entity;

            // Humne order create karte time notes mein yeh data bheja tha
            const productId = paymentEntity.notes.productId;
            const userId = paymentEntity.notes.userId;

            console.log(`✅ Payment verified! User: ${userId}, Product: ${productId}`);

            //Send to BullMQ Queue for inventory deduction
            await checkoutQueue.add("process-checkout", {
                userId: userId,
                productId: productId,
            });
        }

        // Razorpay ko 200 OK dena zaroori hai, warna wo retry karta rahega
        return NextResponse.json({ status: "ok" }, { status: 200 });

    } catch (error) {
        console.error("Webhook processing error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}