import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/jwt";
import Order from "@/models/Order";
import Product from "@/models/Product";

const ensureAdmin = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return { ok: false, status: 401, error: "Unauthorized" };
  const payload = verifyToken(token) as { role?: string } | string;
  const role = typeof payload === "string" ? undefined : payload?.role;
  if (role !== "admin") return { ok: false, status: 403, error: "Forbidden" };
  return { ok: true };
};

const getDateFilter = (range?: string) => {
  const now = new Date();
  if (range === "today") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { createdAt: { $gte: start, $lte: now } };
  }
  if (range === "7d") {
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { createdAt: { $gte: start, $lte: now } };
  }
  if (range === "30d") {
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { createdAt: { $gte: start, $lte: now } };
  }
  return {}; // all
};

export async function GET(req: Request) {
  try {
    await connectDB();
    const auth = await ensureAdmin();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "all";
    const threshold = Number(searchParams.get("threshold") ?? 5);
    const lowStockThreshold = Number.isFinite(threshold) && threshold > 0 ? threshold : 5;

    const dateFilter = getDateFilter(range);

    // Best selling products based on delivered orders only
    const bestSelling = await Order.aggregate([
      { $match: { status: "delivered", ...dateFilter } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          totalQuantity: { $sum: "$items.quantity" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $project: {
          _id: 0,
          productId: "$product._id",
          title: "$product.title",
          category: "$product.category",
          stock: "$product.stock",
          totalQuantity: 1,
        },
      },
    ]);

    // Low stock products
    const lowStockProducts = await Product.find({ stock: { $lte: lowStockThreshold } })
      .sort({ stock: 1 })
      .select("title category stock isActive isOutOfStock")
      .lean();

    return NextResponse.json(
      {
        bestSellingProducts: bestSelling,
        lowStockProducts,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/admin/analytics/products error:", error);
    return NextResponse.json({ error: "Failed to fetch product analytics" }, { status: 500 });
  }
}