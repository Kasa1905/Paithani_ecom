# 🔐 Admin Login Flow - Quick Reference

## 🎯 The Simple Flow

```
┌─────────────────────────────────────────────────────┐
│ User Visits /login                                  │
├─────────────────────────────────────────────────────┤
│ Two Options:                                        │
│                                                     │
│ Option 1: Regular User Login                       │
│ └─ Click: "Login"                                   │
│    └─ Enter email & password                        │
│    └─ Uses: /api/auth/login                         │
│    └─ Redirects to: / (Home)                        │
│                                                     │
│ Option 2: Admin Login                              │
│ └─ Click: "🔐 Login as Admin"                      │
│    └─ Goes to: /admin/login                        │
│    └─ Enter email & password                        │
│    └─ Uses: /api/auth/login                         │
│    └─ Checks role:                                  │
│       ├─ If role='admin' → /admin/dashboard ✅     │
│       └─ If role!='admin' → Error: Not authorized  │
└─────────────────────────────────────────────────────┘
```

---

## ✨ Key Changes

| Page | Change | Result |
|------|--------|--------|
| `/login` | Added "🔐 Login as Admin" link | Users can easily find admin login |
| `/admin/login` | Now uses `/api/auth/login` | Same secure auth as regular users |
| `AuthContext` | `refreshUser()` returns User | Can check role immediately |
| Middleware | Already protects /admin/* | Non-admins can't access admin pages |

---

## 🧪 Quick Test

### Test 1: Admin User
```
Go to: /admin/login
Email: admin@example.com (must have role="admin" in DB)
Password: ••••••••
Expected: Redirects to /admin/dashboard ✅
```

### Test 2: Non-Admin User
```
Go to: /admin/login
Email: user@example.com (has role="user")
Password: ••••••••
Expected: Error message "❌ Not authorized as admin" ✅
```

### Test 3: Unauthorized Access
```
Go to: /admin/orders (directly, not logged in)
Expected: Redirects to /admin/login ✅
```

---

## 📋 Files Changed

```
Modified:
├── app/admin/login/page.tsx          (Updated to check role)
├── app/admin/login/adminLogin.module.css  (Better styling)
├── app/login/page.tsx                (Added admin link)
├── app/login/login.module.css        (Added divider)
└── src/context/AuthContext.tsx       (refreshUser returns User)

Created:
└── docs/ADMIN_LOGIN_FLOW.md          (This guide)
```

---

## 🔒 Security

✅ **httpOnly Cookies** - Token not accessible to JavaScript  
✅ **Role Check** - Happens server-side in JWT + client-side in UI  
✅ **Middleware** - Blocks non-admin access at route level  
✅ **No Backdoors** - Both login pages use same auth logic  

---

## 🚀 What's Next?

1. **Create Admin User:**
   - Register at `/register`
   - Go to MongoDB → Set `role: "admin"`

2. **Login as Admin:**
   - Go to `/admin/login`
   - Enter credentials
   - Access admin dashboard

3. **Everything works!** ✅

---

## 📞 Need Help?

See: [ADMIN_LOGIN_FLOW.md](./ADMIN_LOGIN_FLOW.md) for full documentation
