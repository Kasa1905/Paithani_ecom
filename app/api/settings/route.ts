import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import SiteSettings from '@/models/SiteSettings';

// GET /api/settings - Public route to fetch site settings
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Get or create singleton settings document
    const settings = await (SiteSettings as any).getSingleton();

    return NextResponse.json({
      settings: {
        bannerImageUrl: settings.bannerImageUrl,
        slideshowImages: settings.slideshowImages,
        isBannerVisible: settings.isBannerVisible,
      },
    });
  } catch (error) {
    console.error('[SETTINGS API ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}
