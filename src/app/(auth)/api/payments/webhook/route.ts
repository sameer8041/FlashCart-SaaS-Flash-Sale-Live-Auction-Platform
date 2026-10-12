// src/app/api/payments/webhook/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
//  BullMQ queue import 
import { checkoutQueue } from "@/lib/queue";

export async function POST(req: Request) {
    console.log('Webhook received at /api/payments/webhook');
    try {
        // Raw body read karna zaroori hai signature verification ke liye
        const rawBody = await req.text();
        const signature = req.headers.get("x-razorpay-signature");
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET!;

        console.log("Signature Configured:", !!signature);
        console.log("Secret Configured:", !!secret);


        if (!signature || !secret) {
            console.log("No signature or secret found")
            return NextResponse.json({ error: "No signature or secret found" }, { status: 400 });
        }


        //  Generate HMAC SHA256 Signature
        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(rawBody)
            .digest("hex");

        //  Verify Razorpay Signature (Security Check)
        if (expectedSignature !== signature) {
            console.error("🚨 Invalid Webhook Signature!");
            console.log("Expected Signature:", expectedSignature);
            console.log("Received Signature:", signature);
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }

        console.log("Signature Verified: True")

        //  Parse the verified payload
        const data = JSON.parse(rawBody);



        //  Handle the payment success event
        if (data.event === "payment.captured" || data.event === "order.paid") {
            const paymentEntity = data.payload.payment.entity;

            // Humne order create karte time notes mein yeh data bheja tha
            const productId = paymentEntity.notes.productId;
            const userId = paymentEntity.notes.userId;



            console.log(`✅ Payment verified! User: ${userId}, Product: ${productId}`);


            const rzpPaymentId = paymentEntity.id;
            const rzpOrderId = paymentEntity.order_id;

            console.log(`✅ Webhook verified! Order: ${rzpOrderId}`);
            console.log(`✅ Webhook verified! Payment ID: ${rzpPaymentId}`);

            //Send to BullMQ Queue for inventory deduction
            await checkoutQueue.add("process-checkout", {
                userId: userId,
                productId: productId,
                rzpPaymentId: rzpPaymentId,
                rzpOrderId: rzpOrderId,
            });
            console.log('🚀 Checkout job added to queue');
        }

        // Razorpay ko 200 OK dena zaroori hai, warna wo retry karta rahega
        return NextResponse.json({ status: "ok" }, { status: 200 });

    } catch (error) {
        console.error("Webhook processing error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}