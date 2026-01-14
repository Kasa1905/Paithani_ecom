import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/jwt";
import Order from "@/models/Order";
import Cart from "@/models/Cart";
import Product from "@/models/Product";

// GET /api/orders - Returns user's orders sorted newest first
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

    const orders = await Order.find({ user: userId })
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
    let orderItems: any[] = [];
    let totalAmount = 0;

    // Check if request body contains direct product order (from "Get it now")
    if (body.productId && body.quantity) {
      // Single product order
      const product = await Product.findById(body.productId).lean();
      if (!product) {
        return NextResponse.json(
          { error: "Product not found" },
          { status: 404 }
        );
      }

      orderItems = [{
        product: product._id,
        quantity: body.quantity || 1,
      }];
      totalAmount = product.price * (body.quantity || 1);
    } else {
      // Order from cart
      const cart = await Cart.findOne({ user: userId })
        .populate({ path: "items.product", model: Product })
        .lean();

      if (!cart || cart.items.length === 0) {
        return NextResponse.json(
          { error: "Cart is empty" },
          { status: 400 }
        );
      }

      // Calculate total amount
      interface CartItem {
        product: { _id: string; price: number };
        quantity: number;
      }
      orderItems = cart.items.map((item: CartItem) => {
        const price = item.product?.price || 0;
        totalAmount += price * item.quantity;
        return {
          product: item.product?._id || item.product,
          quantity: item.quantity,
        };
      });

      // Clear cart after creating order from it
      await Cart.deleteOne({ user: userId });
    }

    // Create order with "received" status
    const order = await Order.create({
      user: userId,
      items: orderItems,
      totalAmount,
      status: "received",
    });

    // Return created order with populated data
    const populatedOrder = await Order.findById(order._id)
      .populate({ path: "items.product", model: Product })
      .lean();

    return NextResponse.json({ order: populatedOrder }, { status: 201 });
  } catch (error) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
