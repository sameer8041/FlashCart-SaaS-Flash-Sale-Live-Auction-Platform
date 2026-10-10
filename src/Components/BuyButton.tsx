
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
            const res = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productId: product._id, price: product.price }),
            });

            const data = await res.json();

            // 🛑 Rate Limit Fallback (jo humne Bug 3 me fix kiya tha)
            if (res.status === 429) {
                setStatus("Please wait 5s...");
                setLoading(false);
                setTimeout(() => setStatus(""), 3000);
                return;
            }

            if (data.success && data.jobId) {
                let attempts = 0; // Infinite loop block karne ke liye counter

                const interval = setInterval(async () => {
                    attempts++;

                    try {
                        const statusRes = await fetch(`/api/checkout/status?jobId=${data.jobId}`);

                        // 🚨 NEW: Agar API 404 ya 500 de, toh loop turant rok do!
                        if (!statusRes.ok) {
                            console.error("API Error:", statusRes.status);
                            clearInterval(interval);
                            setStatus("API Error ❌");
                            setLoading(false);
                            return;
                        }

                        const statusData = await statusRes.json();

                        if (statusData.state === "completed") {
                            setStatus("Order Confirmed! 🎉");
                            clearInterval(interval);
                        } else if (statusData.state === "failed") {
                            setStatus(statusData.reason === "Out of Stock" ? "Out of Stock ❌" : "Failed ❌");
                            clearInterval(interval);
                            setTimeout(() => {
                                setStatus("");
                                setLoading(false);
                            }, 3000);
                        } else {
                            setStatus("Processing ⏳");
                        }

                        // 🚨 NEW: Agar worker 15 second tak javab na de, toh fallback
                        if (attempts >= 15) {
                            clearInterval(interval);
                            setStatus("Timeout ❌");
                            setLoading(false);
                        }

                    } catch (intervalError) {
                        // Network disconnect hone par loop roko
                        console.error("Polling crash:", intervalError);
                        clearInterval(interval);
                        setStatus("Network Error");
                        setLoading(false);
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

    const isOutOfStock = product.stock <= 0;

    return (
        <button
            onClick={handleBuy}
            disabled={loading || isOutOfStock} // 🚨 Naya logic
            className={`px-6 py-2 rounded-lg font-bold text-white transition-all ${isOutOfStock
                    ? "bg-gray-400 cursor-not-allowed"
                    : loading
                        ? "bg-blue-400 cursor-wait"
                        : "bg-blue-600 hover:bg-blue-700"
                }`}
        >
            {isOutOfStock ? "Out of Stock" : loading ? status : "Buy Now"}
        </button>
    );
}