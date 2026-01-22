import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectDB from "@/lib/mongodb";
import { verifyToken } from "@/lib/jwt";
import Product from "@/models/Product";

const validateStock = (value: any) => {
  const num = Number(value);
  if (!Number.isInteger(num) || num < 0) {
    throw new Error("INVALID_STOCK");
  }
  return num;
};

const ensureAdmin = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return { ok: false, status: 401, error: "Unauthorized" };
  const payload = verifyToken(token) as { role?: string } | string;
  const role = typeof payload === "string" ? undefined : payload?.role;
  if (role !== "admin") return { ok: false, status: 403, error: "Forbidden" };
  return { ok: true };
};

// GET /api/admin/products - list all products with stock
export async function GET() {
  try {
    await connectDB();
    const auth = await ensureAdmin();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const products = await Product.find({}).lean();
    return NextResponse.json({ products }, { status: 200 });
  } catch (error) {
    console.error("GET /api/admin/products error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

// POST /api/admin/products - create product with multiple images from Cloudinary
export async function POST(req: Request) {
  try {
    await connectDB();
    const auth = await ensureAdmin();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await req.json();
    const { title, description, price, images, category, isActive, stock, isFeatured } = body;

    if (!title || !description || typeof price !== "number" || !category) {
      return NextResponse.json(
        { error: "title, description, price, and category are required" },
        { status: 400 }
      );
    }

    if (price <= 0) {
      return NextResponse.json(
        { error: "price must be greater than 0" },
        { status: 400 }
      );
    }

    // Validate images array (must be from Cloudinary upload)
    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: "At least one image is required (from /api/upload)" },
        { status: 400 }
      );
    }

    let parsedStock = 0;
    try {
      parsedStock = validateStock(stock ?? 0);
    } catch (e) {
      return NextResponse.json({ error: "stock must be a non-negative integer" }, { status: 400 });
    }

    const product = await Product.create({
      title,
      description,
      price,
      images,
      category,
      stock: parsedStock,
      isOutOfStock: parsedStock === 0,
      isActive: isActive !== undefined ? isActive : true,
      isFeatured: isFeatured || false,
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/products error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}

// PUT /api/admin/products - update stock and other fields
export async function PUT(req: Request) {
  try {
    await connectDB();
    const auth = await ensureAdmin();
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

    const body = await req.json();
    const { productId, stock, title, description, price, category, isActive, isFeatured } = body;

    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    const updates: any = {};

    if (stock !== undefined) {
      try {
        const parsedStock = validateStock(stock);
        updates.stock = parsedStock;
        updates.isOutOfStock = parsedStock === 0;
      } catch (e) {
        return NextResponse.json({ error: "stock must be a non-negative integer" }, { status: 400 });
      }
    }

    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (price !== undefined) {
      if (price <= 0) {
        return NextResponse.json({ error: "price must be greater than 0" }, { status: 400 });
      }
      updates.price = price;
    }
    if (category !== undefined) updates.category = category;
    if (isActive !== undefined) updates.isActive = isActive;
    if (isFeatured !== undefined) updates.isFeatured = isFeatured;

    const product = await Product.findByIdAndUpdate(productId, updates, { new: true });
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product }, { status: 200 });
  } catch (error) {
    console.error("PUT /api/admin/products error:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}