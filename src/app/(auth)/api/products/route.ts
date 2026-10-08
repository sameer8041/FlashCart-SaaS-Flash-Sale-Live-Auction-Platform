// src/app/api/products/route.ts
import { NextResponse } from "next/server";
import { ProductService } from "@/Services/product.service";

export async function GET() {
    try {
        const products = await ProductService.getAllProducts();

        return NextResponse.json({
            success: true,
            count: products.length,
            data: products,
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, message: "Server Error" },
            { status: 500 }
        );
    }
}