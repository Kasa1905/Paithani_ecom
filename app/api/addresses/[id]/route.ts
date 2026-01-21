import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/jwt";
import Address from "@/models/Address";
import { Types } from "mongoose";

// DELETE /api/addresses/:id - remove an address belonging to the current user
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid address id" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyToken(token) as { id?: string } | string;
    const userId = typeof payload === "string" ? undefined : payload?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const deleted = await Address.findOneAndDelete({ _id: id, user: userId });
    if (!deleted) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    // If deleted address was default, promote newest remaining address as default for convenience
    if (deleted.isDefault) {
      const newest = await Address.findOne({ user: userId }).sort({ updatedAt: -1 });
      if (newest) {
        newest.isDefault = true;
        await newest.save();
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/addresses/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete address" }, { status: 500 });
  }
}

// PATCH /api/addresses/:id - update default flag for current user
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid address id" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyToken(token) as { id?: string } | string;
    const userId = typeof payload === "string" ? undefined : payload?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { isDefault } = body;

    // Only supporting default toggle for now
    if (isDefault) {
      await Address.updateMany({ user: userId, isDefault: true }, { $set: { isDefault: false } });
    }

    const updated = await Address.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: { isDefault: Boolean(isDefault) } },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }

    return NextResponse.json({ address: updated }, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/addresses/[id] error:", error);
    return NextResponse.json({ error: "Failed to update address" }, { status: 500 });
  }
}
