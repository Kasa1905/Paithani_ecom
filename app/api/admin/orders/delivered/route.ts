import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/jwt";
import Order from "@/models/Order";
import Product from "@/models/Product";
import User from "@/models/User";

// GET /api/admin/orders/delivered - Returns delivered orders (last 15 days)
export async function GET() {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token) as { id?: string; role?: string } | string;
    const role = typeof payload === "string" ? undefined : payload?.role;

    if (role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    // Fetch delivered orders that are NOT archived (within 15-day retention window)
    const deliveredOrders = await Order.find({
      status: 'delivered',
      archivedAt: { $exists: false },
    })
      .populate({ path: "user", model: User })
      .populate({ path: "items.product", model: Product })
      .sort({ deliveredAt: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ orders: deliveredOrders }, { status: 200 });
  } catch (error) {
    console.error("GET /api/admin/orders/delivered error:", error);
    return NextResponse.json(
      { error: "Failed to fetch delivered orders" },
      { status: 500 }
    );
  }
}
