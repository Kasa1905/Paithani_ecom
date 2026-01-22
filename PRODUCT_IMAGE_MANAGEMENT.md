# Product & Image Management Implementation

## Overview
Complete admin product and image management system with Cloudinary integration and dynamic homepage slideshow.

## Database Changes

### Product Model (`src/models/Product.ts`)
```typescript
{
  title: String (required)
  description: String (required)
  price: Number (required, min: 0)
  images: [String] (Cloudinary secure URLs)
  category: String (required)
  stock: Number (required, min: 0, default: 0)
  isOutOfStock: Boolean (default: false)
  isActive: Boolean (default: true)
  isFeatured: Boolean (default: false) // For homepage slideshow
}
```

**Key Changes:**
- Removed: `imageUrl` (single image)
- Added: `images` array for multiple images
- Added: `isFeatured` boolean for homepage slideshow

## API Endpoints

### Admin Endpoints

#### POST /api/admin/products
Create new product with multiple images
```json
{
  "title": "Product Name",
  "description": "Product description",
  "price": 2500,
  "category": "Saree",
  "stock": 10,
  "images": ["https://cloudinary.com/img1.jpg", "..."],
  "isFeatured": true
}
```

**Validations:**
- Price must be > 0
- Stock must be >= 0
- At least 1 image required
- Images must be uploaded via `/api/upload` first

#### PATCH /api/admin/products/:id
Update existing product (partial updates supported)
```json
{
  "title": "Updated Name",
  "price": 3000,
  "images": ["new-img1.jpg", "new-img2.jpg"],
  "stock": 15,
  "isFeatured": false
}
```

#### GET /api/admin/products/:id
Get single product details

#### DELETE /api/admin/products/:id
Delete product (blocks if active orders exist)

**Safety Check:**
- Cannot delete products with non-archived orders
- Returns 400 error if active orders found

### Public Endpoints

#### GET /api/products
List all active products
- Filters: `isActive: true` only
- Returns products with images array

#### POST /api/upload
Upload images to Cloudinary
- Admin only
- Supports multiple files
- Returns secure URLs

## Admin UI

### Product Creation (`/admin/products/new`)
**Features:**
- Multiple image upload with preview
- Remove individual images
- Reorder images (first = primary)
- Featured checkbox
- Real-time Cloudinary upload
- Image gallery preview

**Workflow:**
1. Fill product details
2. Upload images (multiple selection)
3. Preview and remove if needed
4. Check "Featured" for homepage
5. Submit → Creates product

### Product Editing (`/admin/products/[id]`)
**Features:**
- Pre-populated form with existing data
- Add/remove images
- Update all fields
- Active/Featured toggles
- Image gallery management

### Product Listing (`/admin/products`)
**Features:**
- Image thumbnails (80x80)
- Featured status indicator (⭐)
- Quick stock update
- Edit button → detail page
- Delete with confirmation

## User-Facing Changes

### Homepage (`/page.tsx`)
**Dynamic Slideshow:**
- Pulls from `isFeatured` products
- Shows first image from each featured product
- Auto-advances every 4 seconds
- Product title overlay
- Manual navigation buttons

**Logic:**
```typescript
const featured = products.filter(p => 
  p.isFeatured && 
  p.isActive && 
  p.images?.length > 0
);
```

### Product Listing (`/products/page.tsx`)
**Grid View:**
- Shows primary image (first in array)
- Card layout with hover effects
- 280px min width, auto-fit grid
- Responsive 3-4 columns

### Product Detail (`/products/[id]/page.tsx`)
**Image Gallery:**
- Main image display (600x450)
- Thumbnail navigation
- Click to switch images
- Selected thumbnail highlight
- Responsive layout

## Safety Rules Implemented

### 1. Price Validation
```typescript
if (price <= 0) {
  throw new Error("Price must be greater than 0");
}
```

### 2. Stock Validation
```typescript
if (stock < 0 || !Number.isInteger(stock)) {
  throw new Error("Stock must be non-negative integer");
}
```

### 3. Deletion Safety
```typescript
const hasActiveOrders = await Order.findOne({
  'items.productId': id,
  status: { $nin: ['delivered', 'cancelled'] }
});

if (hasActiveOrders) {
  throw new Error("Cannot delete product with active orders");
}
```

### 4. Image Requirement
```typescript
if (!images || images.length === 0) {
  throw new Error("At least one image required");
}
```

## Integration Points

### Cloudinary Upload Flow
1. Admin selects images
2. Frontend uploads to `/api/upload`
3. API uploads to Cloudinary
4. Returns secure URLs
5. URLs stored in `images` array

### Homepage Slideshow
1. Fetches all products
2. Filters by `isFeatured && isActive`
3. Extracts `images[0]` from each
4. Displays in slideshow
5. Auto-updates when products change

### Product Display
1. Product card shows `images[0]`
2. Detail page shows full gallery
3. Thumbnails navigate images
4. All images from Cloudinary

## File Changes Summary

### Models
- `src/models/Product.ts` - Updated schema

### API Routes
- `app/api/admin/products/route.ts` - POST, PUT, GET
- `app/api/admin/products/[id]/route.ts` - GET, PATCH, DELETE
- `app/api/products/route.ts` - Updated GET, POST

### Admin Pages
- `app/admin/products/new/page.tsx` - Complete rewrite
- `app/admin/products/[id]/page.tsx` - New edit page
- `app/admin/products/page.tsx` - Updated listing

### User Pages
- `app/page.tsx` - Dynamic slideshow
- `app/products/page.tsx` - Grid with images
- `app/products/[id]/page.tsx` - Image gallery

## Testing Checklist

- [ ] Create product with multiple images
- [ ] Edit product images (add/remove)
- [ ] Delete product (should block if orders exist)
- [ ] Featured products appear in homepage slideshow
- [ ] Product listing shows first image
- [ ] Product detail shows image gallery
- [ ] Stock validation (no negative)
- [ ] Price validation (must be > 0)
- [ ] Image requirement (at least 1)
- [ ] Cloudinary upload works
- [ ] Thumbnail navigation works
- [ ] Featured checkbox toggles correctly

## Migration Notes

**For Existing Products:**
- Products without `images` array will fail to display
- Manual migration needed:
  ```javascript
  // If you have products with imageUrl field
  db.products.updateMany(
    { imageUrl: { $exists: true } },
    [{ $set: { images: ['$imageUrl'] } }]
  );
  ```

**Default Values:**
- New products: `isFeatured: false`
- Existing products need manual feature toggle

## Usage Instructions

### Admin: Create Product
1. Navigate to `/admin/products`
2. Click "Add New Product"
3. Fill all required fields
4. Upload images (select multiple)
5. Check "Featured" if desired
6. Submit

### Admin: Edit Product
1. Go to `/admin/products`
2. Click "Edit" on any product
3. Modify fields/images
4. Save changes

### Admin: Feature Product
1. Edit product
2. Check "Feature on Homepage Slideshow"
3. Save
4. Product appears on homepage immediately

### User: Browse Products
1. Visit `/products`
2. See grid with product images
3. Click to view detail
4. Navigate image gallery

## Success Criteria
✅ Multiple images per product
✅ Cloudinary integration
✅ Image gallery on detail page
✅ Dynamic homepage slideshow
✅ Admin full CRUD control
✅ Safety validations
✅ Active order deletion prevention
✅ Featured product system
✅ One source of truth
