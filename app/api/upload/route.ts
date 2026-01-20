import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import { uploadImageToCloudinary } from '@/lib/cloudinary';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];

/**
 * POST /api/upload - Generic image upload endpoint (admin only)
 * Accepts multipart/form-data with an 'image' field
 * Uploads to Cloudinary and returns the secure URL
 * 
 * Response: { success: true, imageUrl: "https://res.cloudinary.com/..." }
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token) as { id?: string; role?: string } | string;
    const role = typeof payload === 'string' ? undefined : payload?.role;

    if (role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('image');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'image field with file is required' }, { status: 400 });
    }

    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Allowed: PNG, JPEG, JPG, WEBP, GIF' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    const { url, publicId } = await uploadImageToCloudinary(file, 'paithani/uploads');

    return NextResponse.json(
      {
        success: true,
        imageUrl: url,
        publicId,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('[UPLOAD ERROR]', error);
    const message = error instanceof Error ? error.message : 'Failed to upload file';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
