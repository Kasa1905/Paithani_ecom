import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/jwt";
import Order from "@/models/Order";
import Cart from "@/models/Cart";
import Product from "@/models/Product";
import Address from "@/models/Address";
import { archiveEligibleOrders, getActiveOrdersFilter } from "@/lib/archiveOrders";
import { deductStockAtomically } from "@/lib/stockOperations";

// GET /api/orders - Returns user's ACTIVE orders (non-archived) sorted newest first
// Automatically archives eligible orders (15+ days after delivery) before fetching
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

    // LAZY ARCHIVING: Automatically archive orders that are 15+ days after delivery
    await archiveEligibleOrders();

    // Fetch only ACTIVE orders (non-archived)
    const orders = await Order.find({ 
      user: userId, 
      ...getActiveOrdersFilter() 
    })
      .populate({ path: "items.product", model: Product })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ orders }, { status: 200 });
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create order from cart or single product
// Stock is deducted atomically during order creation (fails fast if insufficient)
// Address selection is REQUIRED; snapshot is stored on the order (no reference kept)
export async function POST(req: Request) {
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

    const body = await req.json();

    const { addressId } = body;

    // Resolve address (must belong to current user). Fallback to raw payload only for backward compatibility.
    let shippingAddress: any = null;
    if (addressId) {
      const addressDoc = await Address.findOne({ _id: addressId, user: userId });
      if (!addressDoc) {
        return NextResponse.json(
          { error: "Address not found for user" },
          { status: 404 }
        );
      }
      shippingAddress = {
        fullName: addressDoc.fullName,
        phone: addressDoc.phone,
        addressLine1: addressDoc.addressLine1,
        addressLine2: addressDoc.addressLine2 || "",
        city: addressDoc.city,
        state: addressDoc.state,
        pincode: addressDoc.pincode,
        country: addressDoc.country || "India",
      };
    } else if (body.address && body.address.fullName && body.address.phone && body.address.addressLine1 && body.address.city && body.address.state && body.address.pincode) {
      shippingAddress = {
        fullName: body.address.fullName,
        phone: body.address.phone,
        addressLine1: body.address.addressLine1,
        addressLine2: body.address.addressLine2 || "",
        city: body.address.city,
        state: body.address.state,
        pincode: body.address.pincode,
        country: body.address.country || "India",
      };
    } else {
      return NextResponse.json(
        { error: "Shipping address is required to place an order" },
        { status: 400 }
      );
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let orderItems: any[] = [];
      let totalAmount = 0;

      // Check if request body contains direct product order (from "Get it now")
      if (body.productId && body.quantity) {
        const quantity = Math.max(1, Number(body.quantity) || 1);
        const product = await Product.findById(body.productId).session(session);
        
        if (!product) {
          await session.abortTransaction();
          return NextResponse.json(
            { error: "Product not found" },
            { status: 404 }
          );
        }

        orderItems = [
          {
            product: product._id,
            quantity,
          },
        ];
        totalAmount = product.price * quantity;
      } else {
        // Order from cart
        const cart = await Cart.findOne({ user: userId })
          .populate({ path: "items.product", model: Product })
          .session(session);

        if (!cart || cart.items.length === 0) {
          await session.abortTransaction();
          return NextResponse.json(
            { error: "Cart is empty" },
            { status: 400 }
          );
        }

        // Build order items and tally total
        for (const item of cart.items) {
          const quantity = Math.max(1, Number(item.quantity) || 1);
          const productId = item.product?._id || item.product;
          const product = await Product.findById(productId).session(session);
          
          if (!product) {
            await session.abortTransaction();
            return NextResponse.json(
              { error: "One or more products not found" },
              { status: 404 }
            );
          }

          totalAmount += (product.price || 0) * quantity;
          orderItems.push({ product: product._id, quantity });
        }

        // Clear cart early so it is part of the transaction
        await Cart.deleteOne({ user: userId }).session(session);
      }

      // Deduct stock atomically (fails fast on insufficient stock)
      const stockDeduction = await deductStockAtomically(
        orderItems.map((item) => ({ product: item.product.toString(), quantity: item.quantity })),
        session
      );

      if (!stockDeduction.success) {
        await session.abortTransaction();
        return NextResponse.json(
          { error: stockDeduction.error || "Insufficient stock", failedProduct: stockDeduction.failedProduct },
          { status: 400 }
        );
      }

      // Create order with "received" status and "pending" payment; address snapshot only
      const order = await Order.create(
        [
          {
            user: userId,
            items: orderItems,
            totalAmount,
            shippingAddress,
            stockDeducted: true,
            status: "received",
            payment: {
              status: "pending",
            },
          },
        ],
        { session }
      );

      await session.commitTransaction();

      // Return created order with populated data
      const populatedOrder = await Order.findById(order[0]._id)
        .populate({ path: "items.product", model: Product })
        .lean();

      return NextResponse.json({ order: populatedOrder }, { status: 201 });
    } catch (err) {
      await session.abortTransaction();

      console.error("POST /api/orders error (transaction):", err);
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
