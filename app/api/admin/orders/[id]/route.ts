import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import mongoose from "mongoose";
import connectDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/jwt";
import Order from "@/models/Order";
import Product from "@/models/Product";
import User from "@/models/User";
import { validateTransition } from "@/lib/orderTransitions";
import { deductStockAtomically, restoreStockAtomically } from "@/lib/stockOperations";

// PATCH /api/admin/orders/[id] - Update order status with strict stock control
// Enforces strict lifecycle: RECEIVED → CONFIRMED → PACKED → SHIPPED → DELIVERED
// Stock is deducted ONLY on confirmation (received → confirmed)
// Stock is restored ONLY when cancelling confirmed orders
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

    const currentOrder = await Order.findById(id);
    if (!currentOrder) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // ARCHIVING RULE: Archived orders are read-only
    if (currentOrder.archivedAt) {
      return NextResponse.json(
        { error: "Cannot modify archived orders. Archived orders are read-only." },
        { status: 400 }
      );
    }

    // Enforce strict lifecycle using centralized transition validation
    const transitionValidation = validateTransition(currentOrder.status, status);
    if (!transitionValidation.valid) {
      return NextResponse.json(
        { error: transitionValidation.error },
        { status: 400 }
      );
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Handle CONFIRMATION: Deduct stock atomically
      if (status === "confirmed" && currentOrder.status === "received") {
        const stockDeduction = await deductStockAtomically(
          currentOrder.items.map((item: { product: mongoose.Types.ObjectId; quantity: number }) => ({
            product: item.product.toString(),
            quantity: item.quantity
          })),
          session
        );

        if (!stockDeduction.success) {
          await session.abortTransaction();
          console.error("[ORDER CONFIRMATION ERROR]", {
            orderId: id,
            error: stockDeduction.error,
            failedProduct: stockDeduction.failedProduct,
            items: currentOrder.items
          });
          return NextResponse.json(
            { 
              error: stockDeduction.error || "Failed to deduct stock",
              failedProduct: stockDeduction.failedProduct
            },
            { status: 400 }
          );
        }

        currentOrder.status = "confirmed";
        await currentOrder.save({ session });
      }
      // Handle CANCELLATION: Restore stock ONLY if order was confirmed
      else if (status === "cancelled") {
        // Only restore stock if order was already confirmed (stock was deducted)
        if (currentOrder.status !== "received") {
          // Order was confirmed, packed, shipped, etc. - need to restore stock
          const restored = await restoreStockAtomically(
            currentOrder.items.map((item: { product: mongoose.Types.ObjectId; quantity: number }) => ({
              product: item.product.toString(),
              quantity: item.quantity
            })),
            session
          );

          if (!restored) {
            await session.abortTransaction();
            return NextResponse.json(
              { error: "Failed to restore stock during cancellation" },
              { status: 500 }
            );
          }
        }
        // If order was still in "received" status, stock was never deducted, so nothing to restore

        currentOrder.status = "cancelled";
        await currentOrder.save({ session });
      }
      // Handle other normal transitions (packed, shipped, delivered)
      else {
        currentOrder.status = status;
        if (status === "delivered") {
          currentOrder.deliveredAt = new Date();
        }
        await currentOrder.save({ session });
      }

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }

    const updatedOrder = await Order.findById(id)
      .populate({ path: "user", model: User })
      .populate({ path: "items.product", model: Product })
      .lean();

    return NextResponse.json({ order: updatedOrder }, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/admin/orders/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
