# Middleware Route Protection - Quick Reference

## What This Middleware Does

Protects routes using JWT authentication in Next.js 16.

**3 Route Types:**
1. **Public** - Anyone can access (no auth needed)
2. **Protected** - Login required
3. **Admin** - Admin role required

---

## Route Protection Matrix

| Route | Public? | Auth Required? | Admin Only? |
|-------|---------|---|---|
| `/` | ✅ Yes | ❌ No | ❌ No |
| `/login` | ✅ Yes | ❌ No | ❌ No |
| `/register` | ✅ Yes | ❌ No | ❌ No |
| `/api/auth/*` | ✅ Yes | ❌ No | ❌ No |
| `/cart` | ❌ No | ✅ Yes | ❌ No |
| `/checkout` | ❌ No | ✅ Yes | ❌ No |
| `/orders` | ❌ No | ✅ Yes | ❌ No |
| `/admin` | ❌ No | ✅ Yes | ✅ Yes |
| `/admin/*` | ❌ No | ✅ Yes | ✅ Yes |

---

## How It Works (Flow)

```
User requests route
    ↓
Middleware checks matcher config
    ↓
Is it a public route? (/, /login, /register, /api/auth/*)
├─ YES → Allow access, skip middleware
└─ NO → Continue to next check
    ↓
Does user have auth_token cookie?
├─ NO → Redirect to /login
└─ YES → Continue to next check
    ↓
Is token valid (JWT verification)?
├─ NO → Redirect to /login
└─ YES → Continue to next check
    ↓
Is it an admin route (/admin/*)?
├─ YES → Is user.role === 'admin'?
│         ├─ NO → Redirect to /
│         └─ YES → Allow access
└─ NO → Allow access
```

---

## File Location

**Create at:** `/proxy.ts` (project root, NOT in src/)

```
Paithani_ecom_Kasa/
├── proxy.ts          ← HERE (root level)
├── app/
├── src/
├── package.json
└── ...
```

**Note:** Next.js 16 uses `proxy.ts` instead of the deprecated `middleware.ts`

---

## Key Implementation Details

### 1. Route Matching
```typescript
export const config = {
  matcher: [
    '/cart',        // Require login
    '/checkout',    // Require login
    '/orders',      // Require login
    '/admin/:path*', // Require admin
  ],
};
```

### 2. Token Reading
```typescript
const authToken = request.cookies.get('auth_token')?.value;
```

### 3. JWT Verification
```typescript
const verified = await jwtVerify(token, secret);
const user = verified.payload;
```

### 4. Redirects
```typescript
// Redirect to login
return NextResponse.redirect(new URL('/login', request.url));

// Redirect to home
return NextResponse.redirect(new URL('/', request.url));

// Allow access
return NextResponse.next();
```

### 5. Proxy Function (Next.js 16)
```typescript
export async function proxy(request: NextRequest) {
  // Route protection logic
}
```

---

## Testing Scenarios

### Test 1: No Auth Cookie
```
1. Clear all cookies
2. Visit http://localhost:3000/cart
3. Should redirect to /login ✅
```

### Test 2: Valid Auth (Regular User)
```
1. Login as test@example.com
2. Visit http://localhost:3000/cart
3. Should load (no redirect) ✅
4. Visit http://localhost:3000/admin
5. Should redirect to / ✅
```

### Test 3: Valid Auth (Admin User)
```
1. Login as admin@example.com (with role: "admin")
2. Visit http://localhost:3000/admin
3. Should load (no redirect) ✅
4. Visit http://localhost:3000/cart
5. Should load (no redirect) ✅
```

### Test 4: Invalid Token
```
1. Login and get auth_token
2. Manually edit cookie value (break it)
3. Visit /cart
4. Should redirect to /login ✅
```

---

## Console Output Expected

When working correctly, you'll see:

```
[Proxy] No token - redirecting /cart to /login
[Proxy] Authenticated access to /cart
[Proxy] Admin access granted for /admin
[Proxy] User not admin - redirecting /admin to /
[Proxy] Invalid token - redirecting /checkout to /login
```

---

## Browser Verification

### Check 1: Auth Cookie Exists
```
DevTools → Application → Cookies → auth_token
Should see: auth_token = (long JWT string)
```

### Check 2: Redirect Happened
```
DevTools → Network tab → Click request
Look for "Type: fetch" or redirect status codes
Status should be 307 (redirect) or 200 (allowed)
```

### Check 3: Protected Route Loads
```
Try accessing /cart while logged in
URL bar shows: http://localhost:3000/cart
Page loads (no redirect to /login)
```

---

## Common Responses

| Scenario | URL | Status | Result |
|----------|-----|--------|--------|
| Not logged in, visit /cart | /login | 307 | Redirect |
| Logged in, visit /cart | /cart | 200 | Load page |
| Admin logged in, visit /admin | /admin | 200 | Load page |
| User logged in, visit /admin | / | 307 | Redirect |
| No token, visit / | / | 200 | Load page |
| Invalid token, visit /checkout | /login | 307 | Redirect |

---

## Environment Setup

### Required in .env.local
```
JWT_SECRET=your-secret-key-here
```

### Required Package
```bash
npm install jose
```

---

## How to Extend

### Add More Protected Routes
```typescript
// In middleware.ts config.matcher
export const config = {
  matcher: [
    '/cart',
    '/checkout',
    '/orders',
    '/admin/:path*',
    '/profile',           // ← Add here
    '/settings',          // ← Add here
  ],
};
```

### Add Role-Based Routes
```typescript
// In middleware function, before return NextResponse.next()
if (pathname.startsWith('/vendor')) {
  if (user.role !== 'vendor') {
    return NextResponse.redirect(new URL('/', request.url));
  }
}
```

### Change Redirect Paths
```typescript
// Redirect to registration instead of login
return NextResponse.redirect(new URL('/register', request.url));

// Redirect to access-denied page
return NextResponse.redirect(new URL('/access-denied', request.url));
```

---

## Debugging Checklist

- [ ] proxy.ts exists at project root (Next.js 16+)
- [ ] Config matcher includes protected routes
- [ ] JWT_SECRET in .env.local
- [ ] Dev server restarted after creating proxy
- [ ] Auth_token cookie set after login
- [ ] jose package installed (`npm install jose`)
- [ ] Proxy logs appear in console
- [ ] Redirects working correctly

---

## Next.js 16 Compatibility

✅ **Using:**
- NextRequest/NextResponse
- Async/await
- Matcher config
- Jose for JWT

✅ **Compatible with:**
- App Router
- Dynamic routes
- Rewrite and redirect
- Cookie handling

---

## Performance Notes

- Middleware runs on every request to matched routes
- JWT verification is fast (~1ms)
- No database queries needed
- Minimal overhead

---

## Security Notes

✅ **Implemented:**
- JWT verification
- HttpOnly cookies
- Secure cookie flag (production)
- SameSite=Strict
- No token in logs

✅ **Best practices:**
- Always verify token
- Check role on backend too
- Use HTTPS in production
- Rotate secrets periodically

---

## Summary

**What Works:**
```
✅ Protects /cart, /checkout, /orders with login requirement
✅ Protects /admin/* with admin role requirement
✅ Public routes accessible to everyone
✅ Redirects invalid tokens to /login
✅ Redirects non-admin to / from /admin
✅ Works on direct URL access and page refresh
```

**To Test:**
```
1. Login: http://localhost:3000/login
2. Visit protected route: http://localhost:3000/cart
3. Check it loads (no redirect)
4. Visit admin route: http://localhost:3000/admin
5. Check it redirects to / (if not admin)
```

**You're Done!** 🎉
