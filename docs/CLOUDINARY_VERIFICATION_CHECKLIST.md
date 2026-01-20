# Cloudinary Pipeline — Final Verification Checklist

## Pre-Flight (Before Testing)

- [ ] Run `npm install` to get cloudinary@2.9.0
- [ ] Verify `.env.local` has:
  - `CLOUDINARY_CLOUD_NAME=<value>`
  - `CLOUDINARY_API_KEY=<value>`
  - `CLOUDINARY_API_SECRET=<value>`
- [ ] Run `npm run dev` and check no TypeScript errors
- [ ] No errors in browser console on page load

## Upload API Tests

### `/api/upload` Route
- [ ] Try uploading without auth token → should return 401
- [ ] Try uploading as non-admin → should return 403
- [ ] Upload valid image (PNG/JPEG/WEBP)
  - Should return: `{ success: true, imageUrl: "https://res.cloudinary.com/...", publicId: "..." }`
- [ ] Try uploading file > 5MB → should return 400 with size error
- [ ] Try uploading non-image (txt, pdf) → should return 400 with type error

## Product Creation Flow

### Admin New Product Form
1. Navigate to `/admin/products/new`
2. Select image from local device
3. See uploading spinner
4. See image preview after upload
5. Fill in product details
6. Click "Create Product"
7. Redirect to `/admin/products` list

### MongoDB Verification
```javascript
// In MongoDB:
db.products.findOne({ title: "Your Test Product" })
// Should see:
{
  _id: ObjectId(...),
  title: "...",
  imageUrl: "https://res.cloudinary.com/...",
  images: [],  // optional array, can be empty
  stock: ...,
  // ... other fields
}
```

❌ **Should NOT see:**
- Local file paths like `/uploads/...`
- Base64 encoded data
- Raw file binary

## Frontend Display Tests

### Products List (`/products`)
- [ ] Navigate to `/products`
- [ ] Images load from Cloudinary
- [ ] No broken image icons
- [ ] Placeholder shows if imageUrl missing

### Product Detail (`/products/[id]`)
- [ ] Click on product
- [ ] Image displays prominently at top
- [ ] Image has correct dimensions
- [ ] "Add to Cart" and "Buy Now" work

### Cart (`/cart`)
- [ ] Add product to cart
- [ ] Navigate to `/cart`
- [ ] Product image shows correctly
- [ ] Image size is appropriate (thumbnail)

## Admin Settings Tests

### Banner Upload
1. Navigate to `/admin/settings`
2. Upload banner image under "Homepage Banner"
3. See preview after upload
4. Save settings
5. Go to `/` (homepage)
6. Banner should display

### Slideshow Upload
1. In `/admin/settings`
2. Upload multiple images under "Homepage Slideshow"
3. See previews of all uploaded images
4. Save settings
5. Go to `/`
6. Slideshow should rotate through Cloudinary URLs

### MongoDB Verification
```javascript
db.sitesettings.findOne({})
// Should see:
{
  bannerImageUrl: "https://res.cloudinary.com/...",
  slideshowImages: [
    "https://res.cloudinary.com/...",
    "https://res.cloudinary.com/...",
  ],
  isBannerVisible: true
}
```

## Browser DevTools Tests

### Network Tab
- [ ] Image requests go to `res.cloudinary.com`
- [ ] No 404s from `/uploads/...` paths
- [ ] Image responses are actual image files (Content-Type: image/*)

### Console
- [ ] No JavaScript errors
- [ ] No CORS errors
- [ ] No warnings about missing imageUrl

### Application Tab
- [ ] auth_token cookie is set (if logged in)
- [ ] No sensitive data in cookies

## Edge Cases

### Missing Image
- [ ] Create product without uploading image
  - Form should show error: "Please upload a product image first"
  - Product NOT created

- [ ] Product with missing imageUrl in DB
  - Frontend shows placeholder image
  - No console errors

### Network Failure
- [ ] Disconnect internet during upload
  - Should see error message
  - User can retry
  - No partial data in DB

### Concurrent Uploads
- [ ] Upload multiple images rapidly
- [ ] Each gets own publicId
- [ ] All URLs stored correctly
- [ ] No duplicates in DB

## Cleanup Verification

- [ ] No imports of `fs`, `path`, `multer` in upload routes
- [ ] No `fs.writeFile()` calls in codebase
- [ ] No `public/uploads/` references in code
- [ ] Local `/public/uploads/` folder ignored by git
  - Run: `git status public/uploads` → should say ignored

## Performance Checks

- [ ] Cloudinary URLs load quickly (< 2s)
- [ ] Image optimization working (check `?q=auto&f=auto` in URL)
- [ ] No excessive re-renders in admin form
- [ ] Cart/list pages load with correct image dimensions

## Production Readiness

- [ ] `.env.local` NOT committed to git
  - Run: `git status` → .env.local should not appear
- [ ] Cloudinary credentials NOT hardcoded anywhere
- [ ] Error messages don't leak sensitive info
- [ ] Image deletion handled gracefully (if implemented)

## Deployment Test (Optional)

If deploying to Vercel:

1. [ ] Set environment variables in Vercel dashboard
2. [ ] Deploy code to Vercel
3. [ ] Test image upload on deployed site
4. [ ] Verify MongoDB reads/writes
5. [ ] Check Vercel Function logs for errors

---

## Sign-Off

- [ ] All tests passed
- [ ] No TypeScript errors: `npm run build`
- [ ] Ready for production use

**Tested By:** ________________  
**Date:** ________________  
**Notes:** ________________

---

**If any test fails:** Check [CLOUDINARY_SETUP_COMPLETE.md](CLOUDINARY_SETUP_COMPLETE.md) troubleshooting section.
