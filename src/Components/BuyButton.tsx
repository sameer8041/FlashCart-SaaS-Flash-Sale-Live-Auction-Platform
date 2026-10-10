// src/components/BuyButton.tsx
"use client";
import { useState } from "react";
import Script from "next/script";

export default function BuyButton({ product }: { product: any }) {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("Buy Now");
    const isOutOfStock = product.stock <= 0;

    const handlePayment = async () => {
        setLoading(true);
        setStatus("Initiating Payment...");

        try {
            //  Backend se Razorpay Order ID fetch 
            const res = await fetch("/api/payments/create", {
                method: "POST",
                body: JSON.stringify({ productId: product._id, price: product.price }),
            });
            const order = await res.json();

            if (order.error) throw new Error(order.error);

            //  Razorpay Checkout Popup Options
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, // .env mein hona zaroori hai
                amount: order.amount,
                currency: order.currency,
                name: "Super Flash Sale",
                description: product.name,
                order_id: order.id,
                //  PAYMENT SUCCESS LOGIC
                handler: function (response: any) {
                    console.log("Razorpay Success:", response);
                    // Yahan hume polling ki zaroorat nahi hai, Webhook queue handle kar lega
                    setStatus("Order Confirmed! 🎉");
                    setLoading(false);
                },
                // Agar user popup band kar de bina pay kiye
                modal: {
                    ondismiss: function () {
                        setLoading(false);
                        setStatus("Buy Now");
                    }
                },
                prefill: {
                    name: "Test User",
                    email: "user@example.com",
                },
                theme: { color: "#2563eb" },
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (error) {
            console.error(error);
            alert("Payment failed to initiate");
            setLoading(false);
            setStatus("Buy Now");
        }
    };

    return (
        <>
            {/* Razorpay script load karna zaroori hai */}
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

            <button
                onClick={handlePayment}
                disabled={loading || isOutOfStock || status === "Order Confirmed! 🎉"}
                className={`px-6 py-2 rounded-lg font-bold text-white transition-all ${isOutOfStock
                    ? "bg-gray-400 cursor-not-allowed"
                    : status === "Order Confirmed! 🎉"
                        ? "bg-green-500 cursor-default" // Success green color
                        : loading
                            ? "bg-blue-400 cursor-wait"
                            : "bg-blue-600 hover:bg-blue-700"
                    }`}
            >
                {isOutOfStock ? "Out of Stock" : status}
            </button>
        </>
    );
}