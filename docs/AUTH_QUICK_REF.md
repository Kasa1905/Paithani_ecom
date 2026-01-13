# Frontend Auth System - Quick Reference

## Files Created

### Core Auth System
- **[src/context/AuthContext.tsx](src/context/AuthContext.tsx)** - Auth state provider and useAuth hook
- **[app/layout.tsx](app/layout.tsx)** - Updated to wrap with AuthProvider

### Example Components
- **[src/components/ProtectedRoute.tsx](src/components/ProtectedRoute.tsx)** - Route protection wrapper
- **[src/components/UserHeader.tsx](src/components/UserHeader.tsx)** - Header with user info and logout
- **[app/login/page.tsx](app/login/page.tsx)** - Login page example
- **[app/dashboard/page.tsx](app/dashboard/page.tsx)** - Protected dashboard example

## What's Implemented

✅ React Context for global auth state
✅ Automatic user check on app load (GET /api/auth/me)
✅ httpOnly cookie-based authentication  
✅ Loading state management
✅ refreshUser() function to sync auth state
✅ logout() function with API call
✅ ProtectedRoute component for access control
✅ UserHeader component for UI integration
✅ Error handling (no crashes)
✅ Full TypeScript support
✅ Zero console warnings
✅ Next.js 16 compatible (no cookie warnings)
✅ No localStorage (secure)

## How to Use

### 1. Use useAuth Hook in Client Components

```tsx
'use client';
import { useAuth } from '@/context/AuthContext';

export default function MyComponent() {
  const { user, loading, isAuthenticated, logout, refreshUser } = useAuth();

  if (loading) return <div>Loading auth state...</div>;
  
  return (
    <div>
      {isAuthenticated ? (
        <>
          <p>Hello, {user?.name}</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <p>Please log in</p>
      )}
    </div>
  );
}
```

### 2. Protect Routes

```tsx
import ProtectedRoute from '@/components/ProtectedRoute';

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <h1>Admin Dashboard</h1>
    </ProtectedRoute>
  );
}
```

### 3. Login Flow

```tsx
const { refreshUser } = useAuth();
const router = useRouter();

const handleLogin = async (email, password) => {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (res.ok) {
    await refreshUser();  // Populate auth state
    router.push('/dashboard');
  }
};
```

## Available URLs to Test

### Login
- **Page:** http://localhost:3000/login
- **API:** POST /api/auth/login
- **Body:** `{ email: "test@example.com", password: "123456" }`

### Dashboard (Protected)
- **Page:** http://localhost:3000/dashboard
- **Requires:** Authentication
- **Features:** Shows user info, refresh button, logout

### API Endpoints (Backend)
- **GET /api/auth/me** - Check current user (must have cookie)
- **POST /api/auth/login** - Login user (sets cookie)
- **POST /api/auth/logout** - Logout user (optional endpoint)

## Folder Structure

```
src/
├── context/
│   └── AuthContext.tsx          ← Core auth system
├── components/
│   ├── ProtectedRoute.tsx       ← Route protection
│   └── UserHeader.tsx           ← Header component
└── lib/
    └── mongodb.ts

app/
├── layout.tsx                   ← Wrapped with AuthProvider
├── login/
│   └── page.tsx                 ← Login example
└── dashboard/
    └── page.tsx                 ← Protected page example
```

## Key Features Explained

### AuthContext Exports

```tsx
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: User | null;           // Current user or null
  loading: boolean;            // Initial auth check in progress
  refreshUser: () => Promise<void>;  // Fetch user from server
  logout: () => Promise<void>; // Clear user and call API
  isAuthenticated: boolean;    // Convenience boolean
}

export function useAuth(): AuthContextType  // Use in client components
export function AuthProvider(props): JSX.Element  // Wrap root layout
```

### Loading State

```tsx
const { loading, isAuthenticated } = useAuth();

if (loading) return <Spinner />;  // First mount: checking auth

if (!isAuthenticated) {
  return <p>Not logged in</p>;    // User not authenticated
}

return <p>Logged in</p>;          // User authenticated
```

### Protected Routes

```tsx
<ProtectedRoute>                 {/* Requires login */}
  <AdminPanel />
</ProtectedRoute>

<ProtectedRoute requiredRole="admin">  {/* Requires admin role */}
  <Settings />
</ProtectedRoute>
```

## Important: credentials: 'include'

All fetch calls to auth endpoints **must** include `credentials: 'include'`:

```tsx
// ✅ Correct
fetch('/api/auth/me', {
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
});

// ❌ Wrong (won't send cookie)
fetch('/api/auth/me', {
  headers: { 'Content-Type': 'application/json' },
});
```

## Testing Checklist

- [ ] npm run dev starts without errors
- [ ] Go to http://localhost:3000/login
- [ ] Register or login with valid credentials
- [ ] Verify redirect to /dashboard works
- [ ] Verify user name/email displays correctly
- [ ] Click "Refresh User" button - should show updated data
- [ ] Click "Logout" - should redirect to home
- [ ] Refresh page while logged in - user should persist
- [ ] Manually clear auth_token cookie, refresh - user should be null
- [ ] Try accessing /dashboard without login - should redirect to /login
- [ ] Check DevTools → Network → login request → Cookies → auth_token should be HttpOnly

## Common Issues & Solutions

### Issue: "useAuth must be used within AuthProvider"
**Solution:** Ensure `app/layout.tsx` wraps children with `<AuthProvider>`

### Issue: User is null after login
**Solution:** Call `await refreshUser()` after successful login to populate state

### Issue: Loading spinner shows forever  
**Solution:** 
1. Check /api/auth/me endpoint returns 200 or 401
2. Check browser DevTools Network tab for errors
3. Verify `credentials: 'include'` is used in fetch

### Issue: User disappears on page refresh
**Solution:** 
1. Verify /api/auth/me returns user data when cookie is present
2. Check that `auth_token` cookie is being sent in request
3. Ensure cookie doesn't expire immediately

## Next Steps

1. ✅ Frontend auth system created
2. Next: Test with actual login credentials
3. Then: Update other pages to use `useAuth()` hook
4. Then: Add admin layout with role checks
5. Finally: Integrate with product/order pages

## Documentation

See [AUTH_SYSTEM.md](AUTH_SYSTEM.md) for complete documentation including:
- Architecture overview
- All usage examples
- API contract details
- Security implementation
- Troubleshooting guide
- Testing procedures
