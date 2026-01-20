import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/jwt";
import Order from "@/models/Order";
import Product from "@/models/Product";
import User from "@/models/User";

/**
 * GET /api/orders/[id]
 * Fetches a single order by ID
 * Only allows users to fetch their own orders
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

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

    const order = await Order.findById(id)
      .populate({ path: "user", model: User })
      .populate({ path: "items.product", model: Product })
      .lean();

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Verify order belongs to authenticated user
    if ((order.user as any)._id.toString() !== userId) {
      return NextResponse.json(
        { message: "Forbidden" },
        { status: 403 }
      );
    }

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    console.error("GET /api/orders/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}
