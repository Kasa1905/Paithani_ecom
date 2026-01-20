import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';
import SiteSettings from '@/models/SiteSettings';

// PUT /api/admin/settings - Admin-only route to update site settings
export async function PUT(req: NextRequest) {
  try {
    await connectDB();

    // Verify admin authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token) as { id?: string; role?: string } | string;
    const role = typeof payload === 'string' ? undefined : payload?.role;

    if (role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden. Admin access required.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { bannerImageUrl, slideshowImages, isBannerVisible } = body;

    // Get or create singleton settings document
    const settings = await (SiteSettings as any).getSingleton();

    // Update fields if provided
    if (bannerImageUrl !== undefined) {
      settings.bannerImageUrl = bannerImageUrl;
    }
    if (slideshowImages !== undefined) {
      settings.slideshowImages = slideshowImages;
    }
    if (isBannerVisible !== undefined) {
      settings.isBannerVisible = isBannerVisible;
    }

    await settings.save();

    return NextResponse.json({
      message: 'Settings updated successfully',
      settings: {
        bannerImageUrl: settings.bannerImageUrl,
        slideshowImages: settings.slideshowImages,
        isBannerVisible: settings.isBannerVisible,
      },
    });
  } catch (error) {
    console.error('[ADMIN SETTINGS API ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

// GET /api/admin/settings - Admin route to fetch settings (same as public but for admin panel)
export async function GET() {
  try {
    await connectDB();

    // Verify admin authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token) as { id?: string; role?: string } | string;
    const role = typeof payload === 'string' ? undefined : payload?.role;

    if (role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden. Admin access required.' },
        { status: 403 }
      );
    }

    const settings = await (SiteSettings as any).getSingleton();

    return NextResponse.json({
      settings: {
        bannerImageUrl: settings.bannerImageUrl,
        slideshowImages: settings.slideshowImages,
        isBannerVisible: settings.isBannerVisible,
      },
    });
  } catch (error) {
    console.error('[ADMIN SETTINGS API ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}
