// src/components/BuyButton.tsx
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
                body: JSON.stringify({
                    productId: product._id,
                    price: product.price
                }),
            });

            const data = await res.json();
            if (data.success) {
                setStatus("In Queue 🕒"); // User ko pata chal gaya order line me hai
            } else {
                setStatus("Failed");
            }
        } catch (error) {
            setStatus("Error");
        } finally {
            setLoading(false);
            // 3 second baad button reset
            setTimeout(() => setStatus(""), 3000);
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