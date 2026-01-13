# Frontend Auth System - Visual Guide

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js 16 App                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │         app/layout.tsx (Root Layout)                       │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │  <AuthProvider>                                      │  │  │
│  │  │  └─ useAuth() available to all children             │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
│           │                                                        │
│           ├─ app/login/page.tsx          ┌─ <ProtectedRoute>   │
│           ├─ app/dashboard/page.tsx  ─→ │  ├─ No login → /login│
│           ├─ app/admin/page.tsx      ─→ │  ├─ No admin → /    │
│           └─ ... other pages            └─ Logged in → Show   │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                  ┌───────────┴────────────┐
                  │                        │
              useAuth()            AuthProvider
              
           Returns:              Manages:
           - user               - Global auth state
           - loading            - User object
           - isAuth             - Loading flag
           - logout()           - Initial check
           - refresh()          - Cookie handling
```

---

## Data Flow Diagram

### On App Mount
```
1. App starts
   ↓
2. <AuthProvider> renders
   ↓
3. useEffect runs → calls GET /api/auth/me
   ↓
4. Browser sends auth_token cookie
   ↓
5. Backend returns user or 401
   ↓
6. AuthContext updates state
   ↓
7. Components can now useAuth()
```

### On Login
```
1. User submits form
   ↓
2. POST /api/auth/login with credentials
   ↓
3. Backend validates
   ↓
4. Sets auth_token cookie in response
   ↓
5. Call refreshUser() to sync state
   ↓
6. user object populated in context
   ↓
7. Components re-render with user
   ↓
8. Redirect to /dashboard
```

### On Logout
```
1. User clicks logout
   ↓
2. Call logout() function
   ↓
3. POST /api/auth/logout (optional)
   ↓
4. Set user = null in state
   ↓
5. Components detect !isAuthenticated
   ↓
6. Redirect to /login or show login prompt
   ↓
7. Cookie expires on next request
```

---

## Component Dependency Tree

```
src/context/AuthContext.tsx
├─ Exports: AuthProvider, useAuth
├─ State: user, loading
└─ Methods: refreshUser(), logout()

        ↓ wraps ↓

app/layout.tsx
└─ <AuthProvider>
    └─ All children have useAuth() access

        ↓ used by ↓

Multiple Consumer Components:

├─ src/components/ProtectedRoute.tsx
│  └─ useAuth() → checks isAuthenticated
│     ├─ redirects if not logged in
│     └─ redirects if wrong role
│
├─ src/components/UserHeader.tsx
│  └─ useAuth() → shows user info
│     ├─ Shows name/email when logged in
│     └─ Shows login link when logged out
│
├─ app/login/page.tsx
│  └─ useAuth() → refreshUser() on login
│     └─ Syncs auth state after POST
│
├─ app/dashboard/page.tsx
│  └─ ProtectedRoute wrapper
│     └─ useAuth() → displays user data
│
└─ Any other component
   └─ useAuth() → conditional rendering
      └─ Can react to isAuthenticated
```

---

## State Management Diagram

```
AuthContext
│
├─ user: User | null
│  ├─ id: string
│  ├─ name: string
│  ├─ email: string
│  └─ role: 'user' | 'admin'
│
├─ loading: boolean
│  ├─ true during initial GET /api/auth/me
│  └─ false when check completes
│
├─ isAuthenticated: boolean
│  └─ Convenience: !!user
│
├─ refreshUser(): Promise<void>
│  ├─ Calls: GET /api/auth/me
│  ├─ Updates: user state
│  └─ Used after login
│
└─ logout(): Promise<void>
   ├─ Calls: POST /api/auth/logout
   ├─ Updates: user = null
   └─ Used for sign out
```

---

## Request/Response Flow

### Login Request
```
Browser                           Backend
   │                                │
   ├─ POST /api/auth/login         │
   │  {                             │
   │    email,                      │
   │    password                    │
   │  }                             │
   ├─────────────────────────────→ │
   │                         Validate
   │                         Hash password
   │                         Check DB
   │                                │
   │  ← ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤
   │  200 OK                        │
   │  Set-Cookie: auth_token=...    │
   │  {                             │
   │    message,                    │
   │    user: { id, name, ... }     │
   │  }                             │
   │                                │
```

### Get Current User Request
```
Browser                           Backend
   │                                │
   │  GET /api/auth/me              │
   │  Cookie: auth_token=...        │
   ├─────────────────────────────→ │
   │                         Verify token
   │                         Get user
   │                                │
   │  ← ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤
   │  200 OK                        │
   │  {                             │
   │    user: { id, name, ... }     │
   │  }                             │
   │                                │
   │           OR                   │
   │                                │
   │  ← ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┤
   │  401 Unauthorized              │
   │  {                             │
   │    message: "..."              │
   │  }                             │
   │                                │
```

---

## Component Relationships

```
AuthContext.tsx (Context Provider)
│
├─ Wraps app/layout.tsx
│
├─ Provides useAuth() hook
│
└─ Manages:
   ├─ User state (from GET /api/auth/me)
   ├─ Loading state
   ├─ refreshUser() function
   └─ logout() function


ProtectedRoute.tsx (Route Guard)
│
├─ Uses: useAuth()
│
├─ Checks:
│  ├─ loading (show spinner)
│  ├─ isAuthenticated (redirect if false)
│  └─ user.role (redirect if wrong role)
│
└─ Used in: Protected pages


UserHeader.tsx (UI Component)
│
├─ Uses: useAuth()
│
├─ Displays:
│  ├─ User name/email if logged in
│  └─ Login button if logged out
│
└─ Used in: App header/navbar


Example Pages:
├─ app/login/page.tsx
│  └─ Uses: useAuth().refreshUser()
│
└─ app/dashboard/page.tsx
   └─ Wrapped with: <ProtectedRoute>
      └─ Uses: useAuth() for user display
```

---

## File Organization

```
src/
│
├─ context/
│  └─ AuthContext.tsx              ← 'use client' hook & provider
│     ├─ interface User
│     ├─ type AuthContextType
│     ├─ createContext()
│     ├─ AuthProvider component
│     └─ useAuth() hook
│
├─ components/
│  ├─ ProtectedRoute.tsx           ← 'use client' route guard
│  │  ├─ useAuth() hook
│  │  ├─ useRouter for redirects
│  │  └─ Loading + Auth checks
│  │
│  └─ UserHeader.tsx               ← 'use client' display component
│     ├─ useAuth() hook
│     └─ Conditional rendering
│
└─ ... other directories

app/
│
├─ layout.tsx                      ← Server component wrapping with AuthProvider
│  └─ <AuthProvider>
│     └─ {children}
│
├─ api/
│  └─ auth/
│     ├─ login/route.ts            ← POST: Authenticate & set cookie
│     ├─ me/route.ts               ← GET: Return current user
│     └─ logout/route.ts           ← POST: Clear cookie
│
├─ login/
│  └─ page.tsx                     ← 'use client' login form
│     └─ useAuth().refreshUser()
│
├─ dashboard/
│  └─ page.tsx                     ← 'use client' protected page
│     ├─ <ProtectedRoute>
│     └─ useAuth() for display
│
└─ ... other pages
```

---

## User State Lifecycle

```
Page Load
    ↓
app/layout.tsx renders
    ↓
<AuthProvider> mounts
    ↓
useEffect runs:
├─ loading = true
├─ Call GET /api/auth/me
├─ Wait for response
├─ Update state
└─ loading = false
    ↓
Components render:
├─ Check loading
│  └─ if (loading) show Spinner
│
├─ Check isAuthenticated
│  ├─ true → show user content
│  └─ false → show login prompt
│
└─ Can access:
   ├─ user object
   ├─ logout() function
   ├─ refreshUser() function
   └─ isAuthenticated boolean
```

---

## Role-Based Access Control

```
ProtectedRoute Component:

Props:
├─ children: ReactNode
└─ requiredRole?: 'user' | 'admin'

Logic:

if (loading) → Show Spinner
   ↓
else if (!isAuthenticated) → Redirect to /login
   ↓
else if (requiredRole && user.role !== requiredRole) → Redirect to /
   ↓
else → Render children

Usage Examples:

<ProtectedRoute>
  <UserDashboard />           {/* Login required */}
</ProtectedRoute>

<ProtectedRoute requiredRole="admin">
  <AdminPanel />              {/* Login + Admin role required */}
</ProtectedRoute>

<ProtectedRoute requiredRole="user">
  <UserProfile />             {/* Explicitly require user role */}
</ProtectedRoute>
```

---

## HTTP Cookie Flow

```
Request 1: Login
┌─────────────────────────────────┐
│ POST /api/auth/login            │
│ Body: { email, password }       │
└─────────────────────────────────┘
           ↓
    [Backend validates]
           ↓
┌─────────────────────────────────┐
│ 200 OK                          │
│ Set-Cookie:                     │
│   auth_token=jwt_value          │
│   HttpOnly                      │
│   Secure (production)           │
│   SameSite=Strict               │
│   Max-Age=7d                    │
│   Path=/                        │
└─────────────────────────────────┘
           ↓
Browser stores cookie


Request 2: Check Auth (automatic)
┌─────────────────────────────────┐
│ GET /api/auth/me                │
│ Cookie: auth_token=jwt_value    │
├─────────────────────────────────┤
│ (Browser auto-includes cookie)  │
└─────────────────────────────────┘
           ↓
    [Backend verifies JWT]
           ↓
┌─────────────────────────────────┐
│ 200 OK                          │
│ { user: { id, name, ... } }     │
│                                 │
│ or                              │
│                                 │
│ 401 Unauthorized                │
│ (cookie expired or invalid)     │
└─────────────────────────────────┘


Request 3: Logout
┌─────────────────────────────────┐
│ POST /api/auth/logout           │
│ Cookie: auth_token=jwt_value    │
└─────────────────────────────────┘
           ↓
    [Backend clears cookie]
           ↓
┌─────────────────────────────────┐
│ 200 OK                          │
│ Set-Cookie:                     │
│   auth_token=deleted            │
│   Max-Age=0                     │
└─────────────────────────────────┘
           ↓
Browser removes cookie
```

---

## Error Handling Flow

```
Fetch Request
    ↓
try {
  const response = await fetch(...)
    ├─ if response.ok (200-299)
    │  ├─ Parse JSON
    │  └─ Update state
    │
    ├─ else if 401
    │  └─ Set user = null
    │
    └─ else (other error)
       ├─ console.error()
       └─ Set user = null
       
} catch (error) {
  console.error('Network error', error)
  Set user = null
  
} finally {
  Set loading = false
}
```

---

## Type System

```
Types Defined:

interface User {
  id: string
  name: string
  email: string
  role: 'user' | 'admin'
}

interface AuthContextType {
  user: User | null
  loading: boolean
  refreshUser: () => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: 'user' | 'admin'
}

Usage:

const authState: AuthContextType = useAuth()
const currentUser: User | null = authState.user
const isAdmin: boolean = currentUser?.role === 'admin'
```

---

## Summary

```
┌──────────────────────────────────────────────────┐
│       Frontend Auth System Architecture          │
├──────────────────────────────────────────────────┤
│                                                  │
│  Layer 1: Routing                               │
│  ├─ app/layout.tsx wraps with <AuthProvider>   │
│  └─ All routes have useAuth() access            │
│                                                  │
│  Layer 2: State Management                      │
│  ├─ AuthContext stores: user, loading           │
│  ├─ useAuth() hook provides access              │
│  └─ useEffect handles initial check             │
│                                                  │
│  Layer 3: Authentication                        │
│  ├─ GET /api/auth/me checks login status       │
│  ├─ POST /api/auth/login handles sign in        │
│  └─ POST /api/auth/logout handles sign out      │
│                                                  │
│  Layer 4: Security                              │
│  ├─ httpOnly cookies (XSS protection)           │
│  ├─ credentials: 'include' (CSRF safety)        │
│  └─ Backend validation on every request         │
│                                                  │
│  Layer 5: Components                            │
│  ├─ ProtectedRoute guards pages                 │
│  ├─ UserHeader displays user info               │
│  └─ useAuth() used in any component             │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## Quick Reference

| Component | Purpose | Location |
|-----------|---------|----------|
| `AuthContext` | Core state mgmt | `src/context/` |
| `AuthProvider` | Wraps app | `app/layout.tsx` |
| `useAuth()` | Access state | Any client component |
| `ProtectedRoute` | Guard pages | `src/components/` |
| `UserHeader` | Display user | `src/components/` |
| `GET /api/auth/me` | Check login | Backend |
| `POST /api/auth/login` | Sign in | Backend |
| `POST /api/auth/logout` | Sign out | Backend |

---

**This visual guide helps you understand the system architecture and data flow. 
For detailed implementation, see the source code and documentation files.**
