// src/app/page.tsx
"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import Image from "next/image";

// Product ka type define kar rahe hain TypeScript ke liye
interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  images: string[];
}

export default function Home() {
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Component mount hote hi API call hogi
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        if (data.success) {
          setProducts(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Navbar */}
      <nav className="bg-white shadow-sm p-4 flex justify-between items-center px-8">
        <h1 className="text-2xl font-black text-red-600 tracking-tighter">⚡ FlashCart</h1>
        <div>
          {session ? (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-600">Hi, {session.user?.name}</span>
              <button onClick={() => signOut()} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md font-semibold hover:bg-gray-200">Logout</button>
            </div>
          ) : (
            <button onClick={() => signIn("google")} className="bg-black text-white px-5 py-2 rounded-md font-semibold hover:bg-gray-800">Login</button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <div className="text-center py-12 px-4">
        <h2 className="text-4xl font-extrabold text-gray-900">Live Flash Drops</h2>
        <p className="text-gray-500 mt-2">Limited stock. High demand. Fastest fingers first.</p>
      </div>

      {/* Products Grid */}
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full text-center py-10 font-medium text-gray-500 animate-pulse">
            Fetching catalog...
          </div>
        ) : (
          products.map((product) => (
            <div key={product._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-64 w-full">
                {/* Next.js Image component needs domain in next.config.js, so using standard img for dummy data */}
                <img src={product.images[0]} alt={product.name} className="object-cover w-full h-full" />
                <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-bounce">
                  Only {product.stock} left!
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
                <p className="text-gray-500 text-sm mt-1 line-clamp-2">{product.description}</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-2xl font-black text-gray-900">₹{product.price.toLocaleString()}</span>
                  <button
                    className={`px-6 py-2 rounded-lg font-bold text-white transition-colors ${product.stock > 0 ? "bg-black hover:bg-gray-800" : "bg-gray-300 cursor-not-allowed"
                      }`}
                    disabled={product.stock === 0}
                  >
                    {product.stock > 0 ? "Buy Now" : "Sold Out"}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}