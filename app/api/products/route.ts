import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Product from '@/lib/models/Product';

// Mark as dynamic to avoid caching issues in edge environments
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const products = await Product.find({ isActive: true }).lean();
    return NextResponse.json(products, { status: 200 });
  } catch (error) {
    console.error('GET /api/products error', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // TODO: replace with real admin auth check
    const isAdmin = true;
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, price, images, category, isActive = true } = body;

    if (!title || !description || typeof price !== 'number' || !category) {
      return NextResponse.json(
        { error: 'title, description, price, and category are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const product = await Product.create({
      title,
      description,
      price,
      images: images || [],
      category,
      isActive,
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('POST /api/products error', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
