// src/app/page.tsx
import { ProductService } from "@/Services/product.service";

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await ProductService.getAllProducts();

  return (
    <div className="pb-10">
      <div className="text-center py-12 px-4">
        <h2 className="text-4xl font-extrabold text-gray-900">Live Flash Drops</h2>
        <p className="text-gray-500 mt-2">Limited stock. High demand. Fastest fingers first.</p>
      </div>

      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.length === 0 ? (
          <div className="col-span-full text-center py-10 font-medium text-gray-500">
            No products live right now.
          </div>
        ) : (
          products.map((product: any) => (
            <div key={product._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative h-64 w-full bg-gray-100">
                <img src={product.images[0]} alt={product.name} className="object-cover w-full h-full" />
                <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
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