import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/jwt";
import Product from "@/models/Product";
import { Types } from "mongoose";

const ensureAdmin = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return { ok: false, status: 401, error: "Unauthorized" };
  const payload = verifyToken(token) as { role?: string } | string;
  const role = typeof payload === "string" ? undefined : payload?.role;
  if (role !== "admin") return { ok: false, status: 403, error: "Forbidden" };
  return { ok: true };
};

// DELETE /api/admin/products/:id - Delete product by ID (admin only)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const auth = await ensureAdmin();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const { id } = await params;

    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid product ID" },
        { status: 400 }
      );
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Product deleted successfully", productId: id },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/admin/products/:id error:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
