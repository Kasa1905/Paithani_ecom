import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/jwt";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { getArchivedOrdersFilter } from "@/lib/archiveOrders";

/**
 * GET /api/orders/archived - Returns user's ARCHIVED orders (past orders)
 * 
 * These are orders that were delivered 15+ days ago and have been automatically archived.
 * Archived orders are read-only and provide order history.
 */
export async function GET() {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token) as { id?: string } | string;
    const userId = typeof payload === "string" ? undefined : payload?.id;
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Fetch only ARCHIVED orders for this user
    const orders = await Order.find({ 
      user: userId, 
      ...getArchivedOrdersFilter() 
    })
      .populate({ path: "items.product", model: Product })
      .sort({ archivedAt: -1 }) // Sort by archive date, newest first
      .lean();

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error("GET /api/orders/archived error:", error);
    return NextResponse.json(
      { error: "Failed to fetch archived orders" },
      { status: 500 }
    );
  }
}
