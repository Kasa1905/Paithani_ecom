import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import Order from "@/models/Order";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category")?.trim();
    const sort = searchParams.get("sort")?.trim();

    const filter: Record<string, any> = { isActive: true };
    if (category) {
      filter.category = category;
    }

    // Base query
    let products = await Product.find(filter).lean();

    // Sorting
    if (sort === "price_asc") {
      products = products.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    } else if (sort === "price_desc") {
      products = products.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    } else if (sort === "best_seller") {
      // Count total quantities sold for PAID orders
      const bestSellers = await Order.aggregate([
        { $match: { status: "paid" } },
        { $unwind: "$items" },
        { $group: { _id: "$items.product", ordersCount: { $sum: "$items.quantity" } } },
        { $sort: { ordersCount: -1 } },
      ]);

      const rankMap = new Map<string, number>();
      bestSellers.forEach((doc: any, idx: number) => {
        if (doc?._id) rankMap.set(String(doc._id), idx);
      });

      products = products.sort((a: any, b: any) => {
        const rankA = rankMap.get(String(a._id));
        const rankB = rankMap.get(String(b._id));

        // Products with sales come first, ordered by sales rank
        if (rankA !== undefined && rankB !== undefined) return rankA - rankB;
        if (rankA !== undefined) return -1;
        if (rankB !== undefined) return 1;
        // Fall back to createdAt (newest first)
        return (b.createdAt as any) - (a.createdAt as any);
      });
    }

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

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: "At least one image is required" },
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
      images,
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