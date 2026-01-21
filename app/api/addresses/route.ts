import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/jwt";
import Address from "@/models/Address";

// GET /api/addresses - list addresses for current user (default first)
export async function GET() {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyToken(token) as { id?: string } | string;
    const userId = typeof payload === "string" ? undefined : payload?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const addresses = await Address.find({ user: userId })
      .sort({ isDefault: -1, updatedAt: -1 })
      .lean();

    return NextResponse.json({ addresses }, { status: 200 });
  } catch (error) {
    console.error("GET /api/addresses error:", error);
    return NextResponse.json({ error: "Failed to fetch addresses" }, { status: 500 });
  }
}

// POST /api/addresses - add a new address for current user
export async function POST(req: Request) {
  try {
    await connectDB();

    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyToken(token) as { id?: string } | string;
    const userId = typeof payload === "string" ? undefined : payload?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { fullName, phone, addressLine1, addressLine2, city, state, pincode, country = "India", isDefault } = body;

    if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
      return NextResponse.json({ error: "Missing required address fields" }, { status: 400 });
    }

    // If marked default, unset other defaults for this user
    if (isDefault) {
      await Address.updateMany({ user: userId, isDefault: true }, { $set: { isDefault: false } });
    }

    const address = await Address.create({
      user: userId,
      fullName,
      phone,
      addressLine1,
      addressLine2: addressLine2 || "",
      city,
      state,
      pincode,
      country,
      isDefault: Boolean(isDefault),
    });

    return NextResponse.json({ address }, { status: 201 });
  } catch (error) {
    console.error("POST /api/addresses error:", error);
    return NextResponse.json({ error: "Failed to add address" }, { status: 500 });
  }
}
