// src/models/Product.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
    name: string;
    description: string;
    price: number;
    stock: number;
    images: string[];
    category: string;
    isFlashSale: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        description: { type: String, required: true },
        price: { type: Number, required: true },
        stock: { type: Number, required: true, min: 0 },
        images: [{ type: String }], // Yahan baad me ImageKit ke URLs aayenge
        category: { type: String, required: true },
        isFlashSale: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Next.js hot-reloading fix (Model overwrite error se bachne ke liye)

export default mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);