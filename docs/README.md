# Paithani E-Commerce Platform

A full-stack e-commerce platform built with Next.js for selling premium Paithani sarees. Features real JWT authentication, MongoDB database, role-based access control, and a complete admin dashboard.

## Tech Stack

- **Framework:** Next.js 16.1.1 (App Router) with TypeScript
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT tokens with HTTP-only cookies
- **Styling:** Inline styles (CSS modules planned)
- **Runtime:** Node.js with Turbopack for fast development

## Features

### User Features
- 🛍️ Browse products with details and images
- 🛒 Add products to cart with real-time count updates
- ✏️ Update cart quantities and remove items
- 💳 Place orders directly from cart or "Buy Now" from product page
- 📦 View order history with status tracking
- 🔐 Secure JWT authentication (login/register)

### Admin Features
- 🔒 Protected admin routes (role-based access control)
- 📋 Two-stage order management workflow:
  - **Received Orders:** Review and confirm/reject pending orders
  - **Processing Orders:** Advance orders through stages (confirmed → packed → shipped → delivered)
- 📦 Product management (CRUD operations)
- ⚙️ Site settings management:
  - Banner image configuration
  - Slideshow image carousel
  - Toggle banner visibility
- 🎯 Persistent admin sidebar navigation
- 📊 View all orders with filtering by status

## Project Structure

```
app/
├── layout.tsx                    # Global root layout with auth providers
├── page.tsx                      # Homepage with banner/slideshow
├── providers.tsx                 # Context providers (Auth, Cart)
├── login/page.tsx               # User login
├── register/page.tsx            # User registration
├── products/
│   ├── page.tsx                 # Product listing
│   └── [id]/page.tsx           # Product detail with Add to Cart & Buy Now
├── cart/page.tsx                # Shopping cart with quantity controls
├── orders/page.tsx              # User order history
├── dashboard/page.tsx           # User dashboard
├── admin/
│   ├── layout.tsx              # Admin layout wrapper with auth guard
│   ├── orders/
│   │   ├── page.tsx            # All orders view
│   │   ├── received/page.tsx   # Pending orders (confirm/reject)
│   │   └── processing/page.tsx # Active orders (status progression)
│   ├── products/page.tsx       # Product management
│   └── settings/page.tsx       # Site settings (banner/slideshow)
├── api/
│   ├── auth/
│   │   ├── login/route.ts      # POST - User login
│   │   ├── register/route.ts   # POST - User registration
│   │   └── me/route.ts         # GET - Current user info
│   ├── products/
│   │   ├── route.ts            # GET - List products, POST - Create product
│   │   └── [id]/route.ts       # GET/PUT/DELETE - Single product operations
│   ├── cart/
│   │   └── route.ts            # GET/POST/PUT/DELETE - Cart operations
│   ├── orders/
│   │   └── route.ts            # GET/POST - User orders
│   ├── admin/
│   │   ├── orders/route.ts     # GET/PUT - Admin order management
│   │   └── settings/route.ts   # GET/PUT - Site settings (admin only)
│   └── settings/route.ts       # GET - Public site settings
src/
├── components/
│   └── Header.tsx              # Global navigation header with cart count
├── context/
│   ├── AuthContext.tsx         # Authentication state management
│   └── CartContext.tsx         # Cart count state management
├── models/                     # Mongoose schemas
│   ├── User.ts                 # User model (name, email, password, role)
│   ├── Product.ts              # Product model
│   ├── Order.ts                # Order model with status tracking
│   ├── Cart.ts                 # Cart model with items array
│   └── SiteSettings.ts         # Singleton site settings model
├── lib/
│   ├── mongodb.ts              # MongoDB connection
│   └── jwt.ts                  # JWT token creation/verification
└── app/shared/layouts/
    ├── UserLayout.tsx          # Layout for user pages (with Header)
    └── AdminLayout.tsx         # Layout for admin pages (with sidebar)
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB instance (local or cloud like MongoDB Atlas)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Kasa1905/Paithani_ecom.git
cd Paithani_ecom
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory with required credentials:
```env
MONGODB_URI=<your-mongodb-connection-string>
JWT_SECRET=<your-jwt-secret-key>
RAZORPAY_KEY_ID=<your-razorpay-key-id>
RAZORPAY_KEY_SECRET=<your-razorpay-key-secret>
CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud-name>
CLOUDINARY_API_KEY=<your-cloudinary-api-key>
CLOUDINARY_API_SECRET=<your-cloudinary-api-secret>
# Optional: override default folder
# CLOUDINARY_UPLOAD_FOLDER=paithani-ecom
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**⚠️ SECURITY WARNING:**
- Never commit `.env.local` or any file with real credentials to git
- Get MongoDB URI from https://cloud.mongodb.com/
- Generate JWT secret with: `openssl rand -base64 32`
- Get Razorpay keys from https://dashboard.razorpay.com/

**Getting Razorpay Keys:**
1. Visit [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Sign up for an account (free)
3. Go to Settings → API Keys
4. Copy Key ID (public key) and Key Secret (private key)
5. Use **Test Mode** keys for development (press Toggle on dashboard)
6. Use **Live Mode** keys for production

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Build for Production

```bash
npm run build
npm start
```

## API Endpoints

### Public Routes

#### Authentication
- `POST /api/auth/register` - Register new user
  - Body: `{ name, email, password }`
  - Returns: `{ message, user }`
  
- `POST /api/auth/login` - Login user
  - Body: `{ email, password }`
  - Returns: `{ message, user }` + sets auth_token cookie
  
- `GET /api/auth/me` - Get current user
  - Requires: auth_token cookie
  - Returns: `{ user: { id, name, email, role } }`

#### Products
- `GET /api/products` - List all products
  - Returns: `{ products: [...] }`
  
- `GET /api/products/[id]` - Get single product
  - Returns: `{ product: {...} }`

#### Site Settings
- `GET /api/settings` - Get public site settings
  - Returns: `{ bannerImageUrl, slideshowImages, isBannerVisible }`

### Protected User Routes

#### Cart
- `GET /api/cart` - Get user's cart
  - Returns: `{ items: [...] }` (populated with product details)
  
- `POST /api/cart` - Add item to cart
  - Body: `{ productId, quantity }`
  - Returns: `{ items: [...] }`
  
- `PUT /api/cart` - Update cart item quantity
  - Body: `{ productId, quantity }`
  - Returns: `{ items: [...] }`
  
- `DELETE /api/cart` - Remove item from cart
  - Body: `{ productId }`
  - Returns: `{ items: [...] }`

#### Orders
- `GET /api/orders` - Get user's orders
  - Returns: `{ orders: [...] }`
  
- `POST /api/orders` - Create new order
  - Body: `{ items: [{ product, quantity, price }], totalAmount }`
  - Returns: `{ message, order }`

#### Payments (Razorpay)
- `POST /api/checkout` - Create Razorpay order for payment
  - Body: `{ orderId: string }`
  - Returns: `{ razorpayOrderId, amount, currency, keyId, internalOrderId }`
  - Note: Creates order in "received" status, waiting for payment
  
- `POST /api/payment/verify` - Verify Razorpay payment and confirm order
  - Body: `{ razorpayOrderId, razorpayPaymentId, razorpaySignature, internalOrderId }`
  - Returns: `{ success: true, message: string, order: {...} }`
  - Note: Updates order status to "confirmed" after successful payment

### Protected Admin Routes

All admin routes require `role: 'admin'` in JWT token.

#### Products (Admin)
- `POST /api/products` - Create product
  - Body: `{ title, description, price, category, images }`
  
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product

#### Orders (Admin)
- `GET /api/admin/orders` - Get all orders (with filters)
  - Query: `?status=pending|confirmed|packed|shipped|delivered|cancelled`
  
- `PUT /api/admin/orders` - Update order status
  - Body: `{ orderId, status }`

#### Site Settings (Admin)
- `GET /api/admin/settings` - Get site settings (admin view)
- `PUT /api/admin/settings` - Update site settings
  - Body: `{ bannerImageUrl, slideshowImages, isBannerVisible }`

## Authentication Flow

### User Registration/Login
1. User submits credentials via `/login` or `/register`
2. Server validates and creates JWT token
3. JWT stored in HTTP-only cookie (`auth_token`)
4. `AuthContext` fetches user data via `/api/auth/me`
5. Protected routes check auth state before rendering

### Admin Access
1. User must have `role: 'admin'` in database
2. `app/admin/layout.tsx` verifies admin role on client
3. API routes verify JWT and check role on server
4. Non-admin users redirected to homepage

## Database Models

### User
```typescript
{
  name: String (required)
  email: String (required, unique)
  password: String (required, hashed with bcrypt)
  role: 'user' | 'admin' (default: 'user')
  createdAt: Date
  updatedAt: Date
}
```

### Product
```typescript
{
  title: String (required)
  description: String (required)
  price: Number (required)
  category: String (required)
  images: [String] (array of image URLs)
  stock: Number (default: 0)
  createdAt: Date
  updatedAt: Date
}
```

### Cart
```typescript
{
  user: ObjectId (ref: User, unique per user)
  items: [{
    product: ObjectId (ref: Product)
    quantity: Number (min: 1)
  }]
  createdAt: Date
  updatedAt: Date
}
```

### Order
```typescript
{
  user: ObjectId (ref: User)
  items: [{
    product: ObjectId (ref: Product)
    quantity: Number
    price: Number (snapshot at order time)
  }]
  totalAmount: Number
  status: 'pending' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled'
  createdAt: Date
  updatedAt: Date
}
```

### SiteSettings (Singleton)
```typescript
{
  bannerImageUrl: String
  slideshowImages: [String]
  isBannerVisible: Boolean
  // Only one document exists in collection
}
```

## Testing the Application

### User Flow
1. Register at `/register`
2. Login at `/login`
3. Browse products at `/products`
4. Click a product to view details
5. Click "Add to Cart" or "Buy Now"
6. View cart at `/cart`
7. Adjust quantities or remove items
8. Click "Place Order"
9. View orders at `/orders`

### Admin Flow
1. Login with admin account at `/login`
2. Navigate to `/admin/orders/received`
3. Confirm or reject pending orders
4. Go to `/admin/orders/processing`
5. Advance orders through stages
6. Manage products at `/admin/products`
7. Configure site settings at `/admin/settings`

### Creating an Admin User
Admin users must be created directly in the database. You can:

**Option 1: MongoDB Shell**
```javascript
use paithani_ecom
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

**Option 2: Register normally, then update via MongoDB Compass or Atlas**
1. Register a new user via `/register`
2. Open MongoDB Compass or Atlas
3. Find the user document
4. Change `role` field from `"user"` to `"admin"`

## Environment Variables

Required environment variables in `.env.local`:

```env
# MongoDB Connection String (local or Atlas)
MONGODB_URI=<your-connection-string>

# JWT Secret Key (generate with: openssl rand -base64 32)
JWT_SECRET=<your-secret-key>
```

## Technology Highlights

### Next.js App Router
- Server and client components
- API routes with route handlers
- Dynamic segments with `[id]` folders
- Layouts for shared UI patterns

### Authentication
- JWT tokens with RS256 or HS256
- HTTP-only cookies for security
- Role-based access control
- Client-side and server-side verification

### State Management
- React Context API for global state
- `AuthContext` for user authentication
- `CartContext` for cart count synchronization

### Database
- MongoDB with Mongoose ODM
- Schema validation
- Relationships with refs and populate
- Singleton pattern for site settings

## Known Limitations

- No image upload functionality (URLs only)
- Inline styles instead of CSS modules
- Basic error handling (no toast notifications)
- No pagination for products/orders
- No search or filtering on products
- No email notifications for orders

## Features Implemented Recently

- ✅ **Payment Integration (Razorpay)** - Full payment processing with signature verification

## Future Enhancements

- [ ] Image upload with cloud storage (Cloudinary/AWS S3)
- [ ] CSS modules or Tailwind CSS
- [ ] Toast notifications for user feedback
- [ ] Pagination for large datasets
- [ ] Product search and filtering
- [ ] Email notifications (order confirmation, status updates)
- [ ] Order tracking for users
- [ ] Product reviews and ratings
- [ ] Wishlist functionality
- [ ] Admin analytics dashboard
- [ ] Inventory management
- [ ] Multi-currency support

## License

MIT

## Contributors

- Kaushik Sambe
- Swaraj404 Team

## Support

For issues or questions, please open an issue on GitHub.

---

Built with ❤️ using Next.js and MongoDB
