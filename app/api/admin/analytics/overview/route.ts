import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/jwt";
import Order from "@/models/Order";

const ensureAdmin = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return { ok: false, status: 401, error: "Unauthorized" };
  const payload = verifyToken(token) as { role?: string } | string;
  const role = typeof payload === "string" ? undefined : payload?.role;
  if (role !== "admin") return { ok: false, status: 403, error: "Forbidden" };
  return { ok: true };
};

const getDateFilter = (range?: string) => {
  const now = new Date();
  if (range === "today") {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return { createdAt: { $gte: start, $lte: now } };
  }
  if (range === "7d") {
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return { createdAt: { $gte: start, $lte: now } };
  }
  if (range === "30d") {
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { createdAt: { $gte: start, $lte: now } };
  }
  return {}; // all
};

export async function GET(req: Request) {
  try {
    await connectDB();
    const auth = await ensureAdmin();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "all";
    const match: Record<string, any> = { ...getDateFilter(range) };

    const pipeline: any[] = [
      { $match: match },
      {
        $addFields: {
          computedAmount: {
            $ifNull: [
              "$totalAmount",
              {
                $sum: {
                  $map: {
                    input: "$items",
                    as: "item",
                    in: { $multiply: ["$$item.price", "$$item.quantity"] },
                  },
                },
              },
            ],
          },
        },
      },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalRevenue: { $sum: "$computedAmount" },
              },
            },
          ],
          status: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
              },
            },
          ],
        },
      },
    ];

    const [result] = await Order.aggregate(pipeline);
    const totals = result?.totals?.[0] || { totalOrders: 0, totalRevenue: 0 };
    const ordersByStatus = result?.status || [];

    return NextResponse.json(
      {
        totalOrders: totals.totalOrders,
        totalRevenue: totals.totalRevenue,
        ordersByStatus,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/admin/analytics/overview error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}