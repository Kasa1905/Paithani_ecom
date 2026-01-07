# Paithani E-Commerce Platform

A modern e-commerce platform built with Next.js for selling premium Paithani sarees. The project features separate user and admin modules with protected routes and mock authentication.

## Project Overview

- **Framework:** Next.js 16.1.1 with TypeScript
- **Styling:** Tailwind CSS 4
- **Authentication:** Mock-based (Day 1 - structure phase)
- **Architecture:** Modular with separate User and Admin spaces

## Project Structure

```
src/
├── app/
│   ├── user/
│   │   ├── pages/        # User-facing pages
│   │   ├── components/   # User-specific components
│   │   └── routes.tsx    # Route definitions
│   ├── admin/
│   │   ├── pages/        # Admin dashboard pages
│   │   ├── components/   # Admin-specific components
│   │   └── routes.tsx    # Route definitions
│   └── shared/
│       ├── layouts/      # UserLayout, AdminLayout
│       ├── components/   # Shared components
│       └── ui/          # UI primitives
├── auth/                 # Auth guards (ProtectedRoute, AdminRoute)
├── services/             # API services (future)
├── lib/                  # Utilities and helpers
└── styles/              # Global styles

app/                      # Next.js App Router pages
├── page.tsx            # Home page
├── collections/        # Collections page
├── product/[id]/       # Product detail page
├── cart/               # Shopping cart
├── checkout/           # Checkout page
├── order-success/      # Order confirmation
└── admin/
    ├── login/          # Admin login (public)
    ├── dashboard/      # Admin dashboard (protected)
    ├── products/       # Product management (protected)
    └── orders/         # Order management (protected)
```

## Available Routes

### User Routes (Protected)
- `/` - Home page
- `/collections` - Browse collections
- `/product/[id]` - Product details
- `/cart` - Shopping cart
- `/checkout` - Checkout page
- `/order-success` - Order confirmation

### Admin Routes (Isolated & Protected)
- `/admin/login` - Admin login page (public)
- `/admin/dashboard` - Admin dashboard (protected)
- `/admin/products` - Manage products (protected)
- `/admin/orders` - View orders (protected)

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install --legacy-peer-deps
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app in your browser.

### Build

```bash
npm run build
npm start
```

## Features (Day 1 - Foundation Phase)

✅ Clean repository structure
✅ User and Admin module separation
✅ Protected route boundaries
✅ Mock authentication (isAuthenticated = true, isAdmin = true)
✅ UserLayout and AdminLayout components
✅ All placeholder pages created
✅ TypeScript support
✅ Path aliases configured (@/ points to src/)

## Authentication

Currently using mock authentication for Day 1 structure phase:
- **ProtectedRoute:** Guards user pages, redirects to `/` if not authenticated
- **AdminRoute:** Guards admin pages, redirects to `/admin/login` if not admin

Mock values:
```
isAuthenticated = true
isAdmin = true
```

## Next Steps (Future Phases)

- [ ] Implement real authentication (JWT/Session)
- [ ] Connect backend API
- [ ] Build product catalog
- [ ] Implement shopping cart logic
- [ ] Add payment integration
- [ ] Admin product management
- [ ] Order management system
- [ ] UI/UX enhancements

## Technology Stack

- **Frontend:** Next.js, React 19, TypeScript
- **Styling:** Tailwind CSS 4, PostCSS
- **Linting:** ESLint
- **Package Manager:** npm

## License

MIT

## Author

Paithani Team
