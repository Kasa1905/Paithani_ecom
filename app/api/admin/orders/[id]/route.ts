import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/jwt";
import Order from "@/models/Order";
import Product from "@/models/Product";
import User from "@/models/User";

// PATCH /api/admin/orders/[id] - Update order status (admin only)
export async function PATCH(
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

    const payload = verifyToken(token) as { id?: string; role?: string } | string;
    const role = typeof payload === "string" ? undefined : payload?.role;

    if (role !== "admin") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { status } = body;

    // Valid status transitions
    const validStatuses = ["received", "confirmed", "packed", "shipped", "delivered", "cancelled"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Valid statuses: " + validStatuses.join(", ") },
        { status: 400 }
      );
    }

    // Get current order to validate transition
    const currentOrder = await Order.findById(id);
    if (!currentOrder) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Define valid transitions
    const transitions: Record<string, string[]> = {
      "received": ["confirmed", "cancelled"],
      "confirmed": ["packed", "cancelled"],
      "packed": ["shipped", "cancelled"],
      "shipped": ["delivered"],
      "delivered": [],
      "cancelled": [],
    };

    // Validate transition
    const allowedNextStatuses = transitions[currentOrder.status] || [];
    if (!allowedNextStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Cannot transition from '${currentOrder.status}' to '${status}'` },
        { status: 400 }
      );
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    )
      .populate({ path: "user", model: User })
      .populate({ path: "items.product", model: Product })
      .lean();

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/admin/orders/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
