import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";

export async function GET() {
  try {
    await connectDB();
    // Show products regardless of stock; isActive still respected for manual disables
    const products = await Product.find({}).lean();
    return NextResponse.json({ products }, { status: 200 });
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json();
    const { title, description, price, images, category, isActive, stock } = body;

    if (!title || !description || typeof price !== 'number' || !category) {
      return NextResponse.json(
        { error: "title, description, price, and category are required" },
        { status: 400 }
      );
    }

    const parsedStock = stock !== undefined ? Number(stock) : 0;
    if (!Number.isInteger(parsedStock) || parsedStock < 0) {
      return NextResponse.json(
        { error: "stock must be a non-negative integer" },
        { status: 400 }
      );
    }

    const product = await Product.create({
      title,
      description,
      price,
      images: images || [],
      category,
      stock: parsedStock,
      isOutOfStock: parsedStock === 0,
      isActive: isActive !== undefined ? isActive : true,
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("POST /api/products error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}