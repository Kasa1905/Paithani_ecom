# 🔧 QUICK FIX: Razorpay Credentials Setup

## Current Issue
Your checkout is failing because Razorpay credentials are not configured in `.env.local`.

## Quick Solution (2 options)

### Option 1: Add Real Razorpay Credentials (For Payment Testing)

1. **Sign up for Razorpay**: https://dashboard.razorpay.com/signup
2. **Get Test Mode API Keys**:
   - Go to: https://dashboard.razorpay.com/app/website-app-settings/api-keys
   - Switch to **Test Mode** (toggle in top left)
   - Copy **Key ID** (starts with `rzp_test_`)
   - Click "Generate Secret" and copy the secret

3. **Add to `.env.local`**:
   ```env
   RAZORPAY_KEY_ID=rzp_test_your_key_here
   RAZORPAY_KEY_SECRET=your_secret_key_here
   ```

4. **Restart dev server**:
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

### Option 2: Skip Payment Integration (For Development)

The system now gracefully handles missing Razorpay credentials:
- Orders can still be created
- Checkout page will show "Payment gateway not configured" message
- Admin can still confirm/process orders manually
- All other features work normally

**No action needed** if you want to develop without payment integration.

---

## Current .env.local Status

✅ MongoDB - Configured
✅ JWT Secret - Configured  
✅ Cloudinary - Configured
❌ Razorpay - **Missing** (payment integration disabled)

---

## Testing Razorpay Integration

Once credentials are added, you can test payments:

1. **Test Card Details** (use these in checkout):
   ```
   Card Number: 4111 1111 1111 1111
   Expiry: Any future date (e.g., 12/25)
   CVV: Any 3 digits (e.g., 123)
   Name: Test User
   ```

2. **Test Payment Flow**:
   - Add product to cart
   - Create order
   - Click "Pay Now"
   - Razorpay popup appears
   - Enter test card details
   - Payment succeeds
   - Order payment status updates to "completed"

---

## Error Fixed

**Before**: 500 error with "Razorpay credentials not configured"
**After**: 503 error with clear message: "Payment gateway not configured. Please contact administrator..."

This is more graceful and tells users what's happening instead of a generic error.

---

## Documentation

- Full Razorpay setup guide: `/docs/RAZORPAY_SETUP.md`
- Environment variables guide: `/docs/ENV_SETUP.md`
- Razorpay testing guide: `/docs/RAZORPAY_TESTING.md`
