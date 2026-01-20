import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/jwt";
import Order from "@/models/Order";
import Cart from "@/models/Cart";
import Product from "@/models/Product";
import { archiveEligibleOrders, getActiveOrdersFilter } from "@/lib/archiveOrders";
import { validateStockAvailability } from "@/lib/stockOperations";

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
// IMPORTANT: Stock is NOT deducted here - only validated
// Stock is deducted ONLY when admin confirms order (received → confirmed)
// Address is REQUIRED to place an order
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

    // Validate address is provided
    if (!body.address || !body.address.fullName || !body.address.phone || 
        !body.address.addressLine1 || !body.address.city || 
        !body.address.state || !body.address.pincode) {
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

        // Validate stock availability (does NOT deduct stock)
        const stockCheck = await validateStockAvailability([
          { product: body.productId, quantity }
        ]);

        if (!stockCheck.available) {
          await session.abortTransaction();
          return NextResponse.json(
            { 
              error: stockCheck.error || "Insufficient stock",
              failedProduct: stockCheck.failedProduct
            },
            { status: 400 }
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

        // Build order items and validate stock
        const itemsToValidate: Array<{ product: string; quantity: number }> = [];
        
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

          itemsToValidate.push({ product: String(productId), quantity });
          totalAmount += (product.price || 0) * quantity;
          orderItems.push({ product: product._id, quantity });
        }

        // Validate stock availability (does NOT deduct stock)
        const stockCheck = await validateStockAvailability(itemsToValidate);

        if (!stockCheck.available) {
          await session.abortTransaction();
          return NextResponse.json(
            { 
              error: stockCheck.error || "Insufficient stock for one or more items",
              failedProduct: stockCheck.failedProduct
            },
            { status: 400 }
          );
        }

        // Clear cart after validation
        await Cart.deleteOne({ user: userId }).session(session);
      }

      // Create order with "received" status and "pending" payment
      // Stock is NOT deducted yet - will be deducted when admin confirms
      const order = await Order.create(
        [
          {
            user: userId,
            items: orderItems,
            totalAmount,
            shippingAddress: {
              fullName: body.address.fullName,
              phone: body.address.phone,
              addressLine1: body.address.addressLine1,
              addressLine2: body.address.addressLine2 || '',
              city: body.address.city,
              state: body.address.state,
              pincode: body.address.pincode,
              country: body.address.country || 'India',
            },
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
