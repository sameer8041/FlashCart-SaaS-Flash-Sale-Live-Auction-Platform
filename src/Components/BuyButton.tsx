
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

export default function BuyButton({ product }: { product: any }) {
    const { data: session } = useSession();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");

    const handleBuy = async () => {
        if (!session) {
            alert("Please login first!");
            return;
        }

        setLoading(true);
        setStatus("Queuing...");

        try {
            // 1. Order queue me daalo
            const res = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId: product._id, price: product.price }),
            });

            const data = await res.json();

            if (data.success && data.jobId) {
                // 2. POLLING: Har 1 second me status check karo
                const interval = setInterval(async () => {
                    const statusRes = await fetch(`/api/checkout/status?jobId=${data.jobId}`);
                    const statusData = await statusRes.json();

                    if (statusData.state === "completed") {
                        setStatus("Order Confirmed! 🎉");
                        clearInterval(interval);
                        // Button ko disabled hi rakhte hain success ke baad
                    } else if (statusData.state === "failed") {
                        setStatus(statusData.reason === "Out of Stock" ? "Out of Stock ❌" : "Failed ❌");
                        clearInterval(interval);
                        setTimeout(() => {
                            setStatus("");
                            setLoading(false);
                        }, 3000);
                    } else {
                        // state 'waiting' ya 'active' hai
                        setStatus("Processing ⏳");
                    }
                }, 1000);

            } else {
                setStatus("Failed");
                setLoading(false);
            }
        } catch (error) {
            setStatus("Error");
            setLoading(false);
        }
    };

    if (product.stock === 0) {
        return (
            <button disabled className="px-6 py-2 rounded-lg font-bold text-white transition-colors bg-gray-300 cursor-not-allowed">
                Sold Out
            </button>
        );
    }

    return (
        <button
            onClick={handleBuy}
            disabled={loading}
            className="px-6 py-2 rounded-lg font-bold text-white transition-colors bg-black hover:bg-gray-800 disabled:bg-gray-500"
        >
            {status || "Buy Now"}
        </button>
    );
}