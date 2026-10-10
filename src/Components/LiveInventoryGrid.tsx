// src/components/LiveInventoryGrid.tsx
"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import BuyButton from "./BuyButton";

export default function LiveInventoryGrid({ initialProducts }: { initialProducts: any[] }) {
    const [products, setProducts] = useState(initialProducts);

    useEffect(() => {
        const socket = io("http://localhost:3001");

        // "stock-updated" event, sirf product stock update 
        socket.on("stock-updated", (data) => {
            setProducts((prevProducts) =>
                prevProducts.map((p) =>
                    p._id === data.productId ? { ...p, stock: data.newStock } : p
                )
            );
        });

        return () => { socket.disconnect(); };
    }, []);

    return (
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
                <div key={product._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="relative h-64 w-full bg-gray-100">
                        <img src={product.images[0]} alt={product.name} className="object-cover w-full h-full" />
                        <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                            Only {product.stock} left!
                        </div>
                    </div>
                    <div className="p-5">
                        <h3 className="text-xl font-bold">{product.name}</h3>
                        <div className="mt-4 flex items-center justify-between">
                            <span className="text-2xl font-black">₹{product.price.toLocaleString()}</span>
                            <BuyButton product={product} />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}