import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/jwt";
import Order from "@/models/Order";
import Product from "@/models/Product";
import User from "@/models/User";

// GET /api/admin/orders - Returns all orders (admin only)
export async function GET() {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    console.log('[ADMIN ORDERS] Cookie present:', !!token);
    
    if (!token) {
      console.log('[ADMIN ORDERS] No token found - returning 401');
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token) as { id?: string; role?: string } | string;
    const role = typeof payload === "string" ? undefined : payload?.role;
    
    console.log('[ADMIN ORDERS] User role:', role);

    if (role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const orders = await Order.find()
      .populate({ path: "user", model: User })
      .populate({ path: "items.product", model: Product })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error("GET /api/admin/orders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
