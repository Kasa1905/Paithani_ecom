import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/jwt";
import Order from "@/models/Order";

const generateReference = (orderId: string) => `pay_${Date.now()}_${orderId.slice(-6)}`;

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

    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 });
    }

    const order = await Order.findOne({ _id: orderId, user: userId });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.status !== "payment_pending") {
      return NextResponse.json({ error: "Payment already processed or not allowed" }, { status: 400 });
    }

    const referenceId = generateReference(orderId);
    order.payment.referenceId = referenceId;
    order.payment.status = "pending";
    order.payment.amount = order.payment.amount || order.totalAmount;
    order.payment.currency = order.payment.currency || "INR";

    await order.save();

    return NextResponse.json(
      {
        payment_reference_id: referenceId,
        amount: order.payment.amount,
        currency: order.payment.currency,
        orderId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/payments/initiate error:", error);
    return NextResponse.json({ error: "Failed to initiate payment" }, { status: 500 });
  }
}
