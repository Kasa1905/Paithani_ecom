import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

/**
 * MIDDLEWARE - Route Protection with JWT
 * 
 * Protected routes require valid JWT token in auth_token cookie:
 * - /cart, /checkout, /orders → require login
 * - /admin, /admin/* → require admin role
 * 
 * Public routes (bypass middleware):
 * - /, /login, /register
 * - /api/auth/* (all auth endpoints)
 */

// Get JWT secret from environment
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET not defined in environment variables');
    throw new Error('JWT_SECRET is not configured');
  }
  return new TextEncoder().encode(secret);
};

/**
 * Verify JWT token and extract user data
 */
async function verifyToken(token: string) {
  try {
    const secret = getJwtSecret();
    const verified = await jwtVerify(token, secret);
    return verified.payload;
  } catch (error) {
    console.error('Token verification failed:', error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Main proxy function (Next.js 16 convention)
 * Handles route protection and redirects
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Get auth token from cookies
  const authToken = request.cookies.get('auth_token')?.value;

  // 2. Determine route type
  const isAdminRoute = pathname.startsWith('/admin');
  const isProtectedRoute = ['/cart', '/checkout', '/orders'].some(route => pathname.startsWith(route));

  // 3. Check if user is authenticated
  if (!authToken) {
    // No token found
    if (isAdminRoute || isProtectedRoute) {
      // Redirect to login if trying to access protected routes without token
      console.log(`[Middleware] No token - redirecting ${pathname} to /login`);
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Public route or API route - allow access
    return NextResponse.next();
  }

  // 4. Verify token validity
  const user = await verifyToken(authToken);

  if (!user) {
    // Token is invalid or expired
    if (isAdminRoute || isProtectedRoute) {
      // Redirect to login if token is invalid
      console.log(`[Middleware] Invalid token - redirecting ${pathname} to /login`);
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // For public routes, allow access even with invalid token
    return NextResponse.next();
  }

  // 5. Check admin access for /admin routes
  if (isAdminRoute) {
    if (user.role !== 'admin') {
      // User is logged in but not admin - redirect to home
      console.log(`[Middleware] User not admin - redirecting ${pathname} to /`);
      return NextResponse.redirect(new URL('/', request.url));
    }
    // User is admin - allow access
    console.log(`[Middleware] Admin access granted for ${pathname}`);
    return NextResponse.next();
  }

  // 6. User is authenticated for protected routes
  if (isProtectedRoute) {
    console.log(`[Middleware] Authenticated access to ${pathname}`);
    return NextResponse.next();
  }

  // 7. Default: allow access
  return NextResponse.next();
}

/**
 * Matcher config - which routes go through middleware
 * Only match routes that need protection
 * 
 * Public routes bypass middleware entirely:
 * - / (home)
 * - /login, /register
 * - /api/auth/* (all auth endpoints)
 * - _next/*, favicon.ico, etc. (Next.js internals)
 */
export const config = {
  matcher: [
    // Protected routes - require login
    '/cart',
    '/checkout',
    '/orders',
    // Admin routes - require admin role
    '/admin/:path*',
  ],
};
