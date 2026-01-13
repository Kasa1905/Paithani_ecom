# Frontend Auth System Documentation

## Overview

This is a production-ready frontend authentication system for Next.js 16 App Router using React Context and httpOnly cookies.

## Architecture

### Core Files

#### 1. **src/context/AuthContext.tsx**
The central auth state management using React Context.

**Exports:**
- `AuthProvider` - Wraps the app and manages auth state
- `useAuth()` - Hook to access auth state and methods
- `User` interface - Type definition for user object

**State:**
- `user: User | null` - Current logged-in user or null
- `loading: boolean` - Whether initial auth check is in progress
- `isAuthenticated: boolean` - Convenience boolean

**Methods:**
- `refreshUser()` - Fetch current user from GET /api/auth/me
- `logout()` - Clear user state and call POST /api/auth/logout

**Lifecycle:**
1. On mount, immediately calls `refreshUser()`
2. Sets `loading = true`
3. Fetches GET /api/auth/me with `credentials: 'include'`
4. If 200: Sets user from response
5. If 401: Sets user to null
6. Sets `loading = false`

---

## Usage Examples

### 1. Wrap Root Layout with AuthProvider

**File:** `app/layout.tsx`

```tsx
import { AuthProvider } from '@/context/AuthContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 2. Access Auth State in Client Component

```tsx
'use client';

import { useAuth } from '@/context/AuthContext';

export default function MyComponent() {
  const { user, loading, isAuthenticated, logout } = useAuth();

  if (loading) return <div>Loading...</div>;
  
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <h1>Welcome, {user?.name}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### 3. Call Login API

```tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { refreshUser } = useAuth();
  const router = useRouter();

  const handleLogin = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include', // IMPORTANT: Include httpOnly cookie
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      // Refresh auth state to populate user
      await refreshUser();
      router.push('/dashboard');
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const email = new FormData(e.currentTarget).get('email') as string;
      const password = new FormData(e.currentTarget).get('password') as string;
      handleLogin(email, password);
    }}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit">Login</button>
    </form>
  );
}
```

### 4. Create Protected Routes

**File:** `src/components/ProtectedRoute.tsx`

```tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';

export default function ProtectedRoute({
  children,
  requiredRole,
}: {
  children: ReactNode;
  requiredRole?: 'user' | 'admin';
}) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (requiredRole && user?.role !== requiredRole) {
      router.push('/');
    }
  }, [loading, isAuthenticated, user?.role, requiredRole, router]);

  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated || (requiredRole && user?.role !== requiredRole)) return null;

  return <>{children}</>;
}
```

**Usage:**
```tsx
import ProtectedRoute from '@/components/ProtectedRoute';

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <div>Admin content only</div>
    </ProtectedRoute>
  );
}
```

### 5. Reusable Header Component

**File:** `src/components/UserHeader.tsx`

```tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function UserHeader() {
  const { user, loading, isAuthenticated, logout } = useAuth();

  if (loading) return <header>Loading...</header>;

  return (
    <header>
      {isAuthenticated ? (
        <>
          <span>Welcome, {user?.name}</span>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <Link href="/login">Login</Link>
      )}
    </header>
  );
}
```

---

## API Contract

### GET /api/auth/me

**Request:**
```http
GET /api/auth/me
Cookie: auth_token=<jwt_token>
```

**Success Response (200):**
```json
{
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Unauthorized Response (401):**
```json
{
  "message": "Unauthorized"
}
```

### POST /api/auth/login

**Request:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```
Sets `auth_token` httpOnly cookie automatically.

### POST /api/auth/logout (Optional)

**Request:**
```http
POST /api/auth/logout
Cookie: auth_token=<jwt_token>
```

**Response (200):**
```json
{
  "message": "Logout successful"
}
```

---

## Key Implementation Details

### 1. Credentials: 'include'
All fetch calls to auth endpoints **must** include `credentials: 'include'` to send/receive httpOnly cookies.

```tsx
fetch('/api/auth/me', {
  credentials: 'include', // CRITICAL
  headers: { 'Content-Type': 'application/json' },
});
```

### 2. 'use client' Directive
AuthProvider and all components using `useAuth()` must be client components:

```tsx
'use client';
import { useAuth } from '@/context/AuthContext';
```

### 3. Hydration Safety
AuthContext handles initial loading state, preventing hydration mismatches:
- On mount, calls refreshUser() and sets loading=true
- UI must check loading state before rendering user-dependent content
- After loading=false, UI can safely render based on isAuthenticated

### 4. No localStorage
Auth state is managed purely by React Context and httpOnly cookies.
- No localStorage to avoid XSS vulnerabilities
- Cookies are httpOnly and secure
- On page refresh, AuthProvider refetches from /api/auth/me

### 5. Error Handling
All fetch calls are wrapped in try/catch:
```tsx
try {
  const response = await fetch(...);
  if (response.ok) { /* handle success */ }
  else { /* handle error */ }
} catch (error) {
  console.error('Error:', error);
  setUser(null);
}
```

---

## Folder Structure

```
src/
├── context/
│   └── AuthContext.tsx        # Auth state management
├── components/
│   ├── ProtectedRoute.tsx      # Protected route wrapper
│   └── UserHeader.tsx          # Example header component
└── lib/
    └── mongodb.ts             # Database connection (existing)

app/
├── layout.tsx                 # Wrapped with AuthProvider
├── login/
│   └── page.tsx              # Login page example
└── dashboard/
    └── page.tsx              # Protected page example
```

---

## Testing the Auth System

### 1. Test with Thunder Client/Postman

**Step 1: Register a user**
```
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"
}
```

**Step 2: Login**
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```
Note the `auth_token` cookie in response.

**Step 3: Check auth state**
```
GET /api/auth/me
Cookie: auth_token=<your_token>
```

**Step 4: Test in browser**
- Go to http://localhost:3000/login
- Login with credentials
- Check console - no errors should appear
- Verify redirect to dashboard works
- Verify user info displays correctly

### 2. Browser Testing

1. Open DevTools → Application → Cookies
2. After login, verify `auth_token` cookie exists with:
   - `HttpOnly` ✓
   - `Secure` (in production)
   - `SameSite=Strict`

3. Refresh page - user should still be logged in (AuthProvider refetches)
4. Clear cookie manually - user should be logged out on next page load

---

## Common Patterns

### Redirect Non-Authenticated Users

```tsx
'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedComponent() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) return <div>Loading...</div>;
  return <div>Protected content</div>;
}
```

### Role-Based Access

```tsx
const { user } = useAuth();

if (user?.role !== 'admin') {
  return <div>Access denied</div>;
}
```

### Conditional Rendering

```tsx
const { isAuthenticated, user, loading } = useAuth();

return (
  <>
    {loading && <div>Loading...</div>}
    {!loading && isAuthenticated && <div>Hello, {user?.name}</div>}
    {!loading && !isAuthenticated && <div>Please login</div>}
  </>
);
```

---

## Troubleshooting

### Issue: "useAuth must be used within AuthProvider"
**Solution:** Ensure the component is wrapped with AuthProvider in layout.tsx

### Issue: User data is null after login
**Solution:** 
1. Call `refreshUser()` after successful login
2. Ensure POST /api/auth/login sets the `auth_token` cookie
3. Check that GET /api/auth/me returns proper user object

### Issue: Loading spinner shows forever
**Solution:**
1. Check browser console for fetch errors
2. Verify /api/auth/me endpoint returns 200 or 401
3. Check network tab in DevTools for failed requests

### Issue: Page refreshes and user disappears
**Solution:**
1. Ensure /api/auth/me endpoint returns 200 with user data
2. Check that `auth_token` cookie is being sent (credentials: 'include')
3. Verify httpOnly cookie is properly set in login response

---

## Security Considerations

✅ **Implemented:**
- httpOnly cookies (immune to XSS)
- Secure flag in production
- SameSite=Strict (CSRF protection)
- No localStorage (no sensitive data in JS-accessible storage)
- Proper credential handling in fetch calls

✅ **Recommended:**
- Use HTTPS in production
- Implement refresh token rotation
- Add CSRF tokens if required by backend
- Validate user role on backend before operations
- Use strong password requirements

---

## Summary

This auth system provides:
1. ✅ React Context for global auth state
2. ✅ Automatic user check on app load
3. ✅ Cookie-based authentication (httpOnly)
4. ✅ Loading state management
5. ✅ Easy logout functionality
6. ✅ Protected route component
7. ✅ Role-based access control
8. ✅ Production-ready error handling
9. ✅ No localStorage (secure)
10. ✅ Fully typed with TypeScript

Use the examples and components provided to build your application's auth-dependent features.
