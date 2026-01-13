# Proxy Route Protection - Testing Guide (Next.js 16)

## What Was Implemented

A Next.js proxy (`proxy.ts`) at the project root that:

✅ **Requires login for:**
- `/cart` - User must be authenticated
- `/checkout` - User must be authenticated
- `/orders` - User must be authenticated

✅ **Requires admin role for:**
- `/admin` - User must be logged in with role = "admin"
- `/admin/*` - All admin subroutes

✅ **Public routes (no auth required):**
- `/` - Home page
- `/login` - Login page
- `/register` - Register page
- `/api/auth/*` - All auth endpoints

✅ **How it works:**
1. Reads `auth_token` cookie
2. Verifies JWT using jose
3. Checks user role for admin routes
4. Redirects to `/login` if no/invalid token
5. Redirects to `/` if user not admin on `/admin`

---

## Manual Testing in Browser

### Test 1: Public Routes (No Auth Required)

**Step 1:** Clear cookies (if you have any)
```
DevTools → Application → Cookies → Delete all
```

**Step 2:** Visit public routes
```
http://localhost:3000              ✅ Should load
http://localhost:3000/login        ✅ Should load
http://localhost:3000/register     ✅ Should load
```

**Expected:** All load without redirects

---

### Test 2: Protected Routes Without Login (Not Authenticated)

**Step 1:** Make sure you have no auth_token cookie
```
DevTools → Application → Cookies → auth_token should be empty
```

**Step 2:** Try accessing protected routes
```
http://localhost:3000/cart         → Redirects to /login ✅
http://localhost:3000/checkout     → Redirects to /login ✅
http://localhost:3000/orders       → Redirects to /login ✅
http://localhost:3000/admin        → Redirects to /login ✅
```

**Expected:** All redirect to `/login`

**What to see:**
- URL changes from `/cart` to `/login`
- Browser bar shows: `http://localhost:3000/login`
- Console logs (in server terminal): `[Middleware] No token - redirecting /cart to /login`

---

### Test 3: Protected Routes With User Login

**Step 1:** Login as a regular user
```
GET: http://localhost:3000/login
POST: Enter email: test@example.com, password: 123456
Click: Login button
```

**Step 2:** Check that auth_token cookie was set
```
DevTools → Application → Cookies → auth_token should exist
Values shows: jwt_token_value (very long string)
HttpOnly: ✅ checked
Secure: ✅ checked (in production)
```

**Step 3:** Try accessing user routes (should work)
```
http://localhost:3000/cart         ✅ Should load (no redirect)
http://localhost:3000/checkout     ✅ Should load (no redirect)
http://localhost:3000/orders       ✅ Should load (no redirect)
```

**Expected:**
- All load successfully
- No redirects
- Console logs: `[Middleware] Authenticated access to /cart`

**Step 4:** Try accessing admin route (should redirect)
```
http://localhost:3000/admin        → Redirects to / ✅
```

**Expected:**
- Redirects to home page
- URL changes to `http://localhost:3000/`
- Console logs: `[Middleware] User not admin - redirecting /admin to /`

---

### Test 4: Admin Login (Create Admin User First)

**Step 1:** Create an admin user via API
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@example.com",
    "password": "admin123",
    "role": "admin"
  }'
```

**Step 2:** Logout current user
```
Go to dashboard → Click Logout
Or delete auth_token cookie manually
```

**Step 3:** Login as admin
```
Go to http://localhost:3000/login
Email: admin@example.com
Password: admin123
Click: Login
```

**Step 4:** Check admin access
```
http://localhost:3000/admin        ✅ Should load (no redirect)
http://localhost:3000/admin/products    ✅ Should load
http://localhost:3000/admin/users       ✅ Should load
```

**Expected:**
- Admin pages load without redirect
- Console logs: `[Middleware] Admin access granted for /admin`

---

### Test 5: Token Expiration/Invalidation

**Step 1:** Manually delete the auth_token cookie
```
DevTools → Application → Cookies → auth_token → Delete
```

**Step 2:** Try accessing protected route
```
http://localhost:3000/cart         → Redirects to /login ✅
```

**Expected:**
- Redirects to login even though you were just logged in
- Cookie was removed, so middleware treats you as logged out
- Console logs: `[Middleware] Invalid token - redirecting /cart to /login`

---

### Test 6: Direct URL Access (Refresh Test)

**Step 1:** Login as regular user
```
http://localhost:3000/login
Email: test@example.com
Password: 123456
Click: Login → Redirects to /dashboard
```

**Step 2:** Navigate to protected route
```
Type in address bar: http://localhost:3000/cart
Press Enter
```

**Expected:**
- Page loads successfully without redirect
- No flickering or loading state
- Middleware validates token on direct URL access

**Step 3:** Refresh the page
```
Press: Cmd+R (or Ctrl+R)
```

**Expected:**
- Page stays on `/cart`
- No redirect to login
- Auth persists across refresh
- Middleware validates token fresh

---

## Verification Checklist

Use this checklist to verify middleware is working:

### ✅ Unauthenticated Access
- [ ] `/` loads without redirect
- [ ] `/login` loads without redirect
- [ ] `/register` loads without redirect
- [ ] `/cart` redirects to `/login`
- [ ] `/checkout` redirects to `/login`
- [ ] `/orders` redirects to `/login`
- [ ] `/admin` redirects to `/login`

### ✅ Authenticated (Regular User) Access
- [ ] `/cart` loads (no redirect)
- [ ] `/checkout` loads (no redirect)
- [ ] `/orders` loads (no redirect)
- [ ] `/admin` redirects to `/`
- [ ] `/admin/products` redirects to `/`

### ✅ Authenticated (Admin User) Access
- [ ] `/admin` loads (no redirect)
- [ ] `/admin/products` loads (no redirect)
- [ ] `/admin/users` loads (no redirect)
- [ ] `/cart` loads (no redirect)
- [ ] `/checkout` loads (no redirect)

### ✅ Cookie Handling
- [ ] After login, auth_token cookie exists
- [ ] Cookie is HttpOnly
- [ ] Cookie includes user data (in JWT)
- [ ] Cookie persists on page refresh
- [ ] Deleting cookie redirects to login

### ✅ Console Output
- [ ] Server logs show `[Middleware]` messages
- [ ] Logs show which routes are being redirected
- [ ] Logs show why redirect happened

---

## API Testing (curl/Thunder Client)

### Test API Auth Endpoints (Should Always Work)

**Register:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "New User",
    "email": "newuser@example.com",
    "password": "password123",
    "role": "user"
  }'
```

**Expected:** 201 Created, user object returned

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "password123"
  }'
```

**Expected:** 200 OK, auth_token cookie set

**Get Current User:**
```bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Cookie: auth_token=<your_token>"
```

**Expected:** 200 OK, current user returned

---

## Common Testing Scenarios

### Scenario 1: New User Journey

1. Visit http://localhost:3000 → Works (public)
2. Try /cart → Redirects to /login
3. Visit /login → Works
4. Click "Register" → Works
5. Fill register form → Creates account
6. Redirects to /dashboard
7. Now /cart works
8. /admin redirects to /

**Result:** ✅ PASS

---

### Scenario 2: Admin User Journey

1. Login as admin user
2. Visit /admin → Works
3. Visit /admin/products → Works
4. Visit /cart → Works (admin can access user routes)
5. Logout
6. Try /admin → Redirects to /login

**Result:** ✅ PASS

---

### Scenario 3: Token Expiration

1. Login (auth_token cookie created)
2. Wait 7 days (or manually set expiration)
3. Try accessing /cart
4. Token is expired, redirects to /login

**Result:** ✅ PASS

---

## Server Console Output

When middleware is working, you'll see logs like:

```
[Middleware] No token - redirecting /cart to /login
[Middleware] Authenticated access to /cart
[Middleware] Admin access granted for /admin
[Middleware] User not admin - redirecting /admin to /
[Middleware] Invalid token - redirecting /checkout to /login
```

---

## Browser DevTools Verification

### Check Cookies
```
1. Open DevTools (F12)
2. Go to Application tab
3. Expand Cookies
4. Click localhost:3000
5. Look for auth_token row
   - Name: auth_token
   - Value: (long JWT string)
   - Domain: localhost
   - Path: /
   - Expires: (7 days from login)
   - HttpOnly: ✅
   - Secure: (✅ in production)
   - SameSite: Strict
```

### Check Network Tab
```
1. Open DevTools Network tab
2. Login to account
3. Look for POST /api/auth/login request
4. Check Response Headers
5. Should see: Set-Cookie: auth_token=...
6. Navigate to /cart
7. Should NOT see redirect (200 OK)
```

### Check Console
```
1. Open DevTools Console
2. Look for logs starting with [Middleware]
3. Should see logs for each middleware check
4. Example: [Middleware] Authenticated access to /cart
```

---

## Success Indicators

✅ **Working correctly if:**
- Public routes load without redirects
- Protected routes redirect to /login when not authenticated
- Protected routes load when authenticated
- Admin routes only load for admin users
- Auth_token cookie is set after login
- Middleware logs appear in server console
- Page refresh preserves auth state

❌ **Issues if:**
- Protected routes load without auth (middleware not working)
- Redirects happen on public routes (too restrictive)
- Admin routes accessible to regular users
- Auth_token cookie not set
- Page refresh logs out user
- No middleware logs in console

---

## Troubleshooting

### Issue: Routes not redirecting
**Check:**
1. Is middleware.ts in project root? (not src/)
2. Is matcher config correct?
3. Are routes spelled correctly?
4. Did you restart dev server after creating middleware?

**Fix:**
```bash
npm run dev  # Restart dev server
```

### Issue: All routes redirect to /login
**Check:**
1. Is JWT_SECRET set in .env.local?
2. Is token being set on login?
3. Is route actually in protected list?

**Fix:**
1. Check .env.local has JWT_SECRET
2. Check auth_token cookie exists after login
3. Check middleware.ts matcher config

### Issue: Admin routes accessible to regular users
**Check:**
1. Is user.role being set correctly in JWT?
2. Is middleware checking role === 'admin'?
3. Is token being verified?

**Fix:**
1. Check JWT payload includes role
2. Check middleware.ts has role check

---

## Summary

Middleware is working when:
1. ✅ Unauthenticated users can't access protected routes (redirect to /login)
2. ✅ Authenticated users can access protected routes (no redirect)
3. ✅ Non-admin users can't access /admin (redirect to /)
4. ✅ Admin users can access /admin (no redirect)
5. ✅ Public routes work for everyone (no redirect)
6. ✅ Auth persists on page refresh
7. ✅ Server logs show middleware activity

**All tests passing? You're done! 🎉**
