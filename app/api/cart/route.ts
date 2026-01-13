import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Types } from "mongoose";
import connectDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/jwt";
import Cart from "@/models/Cart";
import Product from "@/models/Product";

// GET /api/cart - Requires auth, returns user's cart with populated products
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

    const cart = await Cart.findOne({ user: userId })
      .populate({ path: "items.product", model: Product })
      .lean();

    if (!cart) {
      return NextResponse.json({ items: [] }, { status: 200 });
    }

    return NextResponse.json({ items: cart.items }, { status: 200 });
  } catch (error) {
    console.error("GET /api/cart error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cart" },
      { status: 500 }
    );
  }
}

// POST /api/cart - Requires auth, body: { productId, quantity }
// If product exists in cart, increment quantity; else add. Creates cart if missing.
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
    const { productId, quantity } = body;

    if (!productId || typeof productId !== "string") {
      return NextResponse.json(
        { error: "productId is required" },
        { status: 400 }
      );
    }

    if (!Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { error: "Invalid productId" },
        { status: 400 }
      );
    }

    const qty = typeof quantity === "number" && quantity > 0 ? quantity : 1;

    let cart = await Cart.findOne({ user: userId });

    if (!cart) {
      cart = await Cart.create({
        user: userId,
        items: [{ product: productId, quantity: qty }],
      });
    } else {
      const idx = cart.items.findIndex(
        (item) => item.product.toString() === productId
      );
      if (idx >= 0) {
        cart.items[idx].quantity += qty;
      } else {
        cart.items.push({ product: productId, quantity: qty });
      }
      await cart.save();
    }

    const populated = await Cart.findById(cart._id)
      .populate({ path: "items.product", model: Product })
      .lean();

    return NextResponse.json(
      { items: populated?.items || [] },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/cart error:", error);
    return NextResponse.json(
      { error: "Failed to update cart" },
      { status: 500 }
    );
  }
}
