# Razorpay Payment Integration Guide

This document provides comprehensive instructions for setting up and testing the Razorpay payment integration in the Paithani e-commerce platform.

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Configuration](#configuration)
4. [Testing](#testing)
5. [Payment Flow](#payment-flow)
6. [Troubleshooting](#troubleshooting)
7. [Security Notes](#security-notes)

## Overview

The Paithani e-commerce platform integrates Razorpay for secure payment processing. The integration handles:

- Creating orders in the Razorpay system
- Opening the Razorpay payment modal for customer payments
- Verifying payment signatures for security
- Updating order status after successful payment
- Supporting test and live modes

### Key Features

✅ **Secure Signature Verification** - HMAC-SHA256 verification of payment signatures  
✅ **Test Mode Support** - Easy testing with Razorpay test credentials  
✅ **Order Status Management** - Automatic order confirmation after payment  
✅ **Error Handling** - Comprehensive error messages for debugging  
✅ **Logging** - Detailed logs for payment verification issues  

## Getting Started

### Prerequisites

- Razorpay account (free - https://razorpay.com/)
- Node.js and npm installed
- Running Paithani e-commerce application
- MongoDB connection configured

### Step 1: Create Razorpay Account

1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Click "Sign Up" and create an account
3. Verify your email address
4. Complete basic profile information

### Step 2: Get API Keys

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Navigate to **Settings → API Keys**
3. You'll see two sections:
   - **Test Mode** (for development)
   - **Live Mode** (for production)

4. For development, copy the **Test Mode** keys:
   - Key ID (public key)
   - Key Secret (private key)

> **Note**: Keep your Key Secret private! Never commit it to version control.

## Configuration

### Step 1: Update Environment Variables

Add your Razorpay keys to `.env.local`:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=<your-test-mode-key-id>
RAZORPAY_KEY_SECRET=<your-test-mode-key-secret>

# Other existing variables
MONGODB_URI=<your-mongodb-uri>
JWT_SECRET=<your-jwt-secret>
```

### Step 2: Verify Installation

Restart your development server:

```bash
npm run dev
```

The application should start without errors related to missing Razorpay keys.

### Step 3: Load Razorpay Script

The Razorpay payment modal script is automatically loaded in the checkout page. You'll see the script tag being added when you visit the checkout page.

## Testing

### Test Mode Setup

All development should use Razorpay **Test Mode**. This allows you to test the entire payment flow without real transactions.

#### Test Credentials

When in Test Mode, use these credentials:

**Test Card Details:**
- Card Number: `4111 1111 1111 1111`
- Expiry: Any future date (e.g., `12/25`)
- CVV: Any 3-digit number (e.g., `123`)
- Name: Any name (e.g., `Test User`)

**Test UPI:**
- UPI ID: `success@razorpay` (for success)
- UPI ID: `fail@razorpay` (for failed payments)

### Testing Workflow

1. **Create an Order**
   - Go to the home page
   - Browse products and add to cart
   - Click "Proceed to Checkout"
   - Cart page will show "Place Order" button
   - Click to create an order (order status = "received")

2. **Go to Checkout**
   - Navigate to Orders page
   - Click on the order in "received" status
   - You'll be redirected to checkout page (or manually go to `/checkout?orderId=<order-id>`)

3. **Complete Payment**
   - Click "Pay with Razorpay" button
   - The Razorpay payment modal opens
   - Enter test card details:
     - Card Number: `4111 1111 1111 1111`
     - Expiry: Any future date
     - CVV: Any 3 digits
   - Click "Pay ₹<amount>"

4. **OTP Verification (if applicable)**
   - If prompted, enter any 6-digit OTP (e.g., `123456`)

5. **Verify Success**
   - Payment succeeds → Order status changes to "confirmed"
   - You'll be redirected to orders page
   - You should see a "payment=success" notification

### Testing Payment Failures

To test payment failures:

1. In the Razorpay modal, use invalid card details
2. Or use UPI ID: `fail@razorpay`
3. Payment will be declined
4. Error message will appear on checkout page
5. Order remains in "received" status (not confirmed)

### Testing via Razorpay Dashboard

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Go to **Transactions → Payments**
3. You'll see all test payments (marked with "Test Mode" badge)
4. Click on a payment to see:
   - Payment ID
   - Order ID
   - Amount
   - Status (captured/failed)
   - Receipt (your internal order ID)

## Payment Flow

### Complete User Journey

```
1. User Adds Items to Cart
   ↓
2. User Clicks "Place Order"
   → POST /api/orders
   → Order created with status = "received"
   → Reduced stock immediately
   → Redirect to Orders page
   ↓
3. User Clicks Order to Pay
   → GET /api/orders/<orderId>
   → Fetch order details
   → Redirect to checkout page
   ↓
4. User Initiates Payment
   → Click "Pay with Razorpay" button
   → handlePayment() function triggered
   ↓
5. Create Razorpay Order
   → POST /api/checkout
   → Create Razorpay order with amount
   → Return Razorpay Order ID and Key
   ↓
6. Open Payment Modal
   → Initialize Razorpay modal
   → Display payment form
   → User enters card details
   ↓
7. Process Payment
   → Razorpay processes payment
   → Razorpay returns payment details if successful
   ↓
8. Verify Payment
   → verifyPayment() function triggered
   → POST /api/payment/verify
   → Backend verifies signature
   → Fetch payment details from Razorpay
   → Update order status to "confirmed"
   ↓
9. Confirmation
   → User redirected to Orders page
   → Order shows status = "confirmed"
   → Payment details stored in database
```

### Database Changes

**Order Document (after successful payment):**

```javascript
{
  _id: "ObjectId",
  user: "userId",
  items: [
    {
      product: "productId",
      quantity: 2,
      price: 5000
    }
  ],
  totalAmount: 10000,
  status: "confirmed", // Changed from "received"
  payment: {
    razorpayOrderId: "order_ABC123",
    razorpayPaymentId: "pay_XYZ789",
    razorpaySignature: "signature_hash",
    status: "completed",
    amount: 1000000, // in paise
    currency: "INR"
  },
  createdAt: "2024-01-15T10:30:00Z",
  updatedAt: "2024-01-15T10:35:00Z"
}
```

## API Reference

### POST /api/checkout

**Purpose:** Create a Razorpay order for payment

**Authentication:** Required (JWT token)

**Request Body:**
```json
{
  "orderId": "64a1b2c3d4e5f6g7h8i9j0k1"
}
```

**Response (Success - 200):**
```json
{
  "razorpayOrderId": "order_IluGWxBJIzG1qE",
  "amount": 500000,
  "currency": "INR",
  "keyId": "rzp_test_your_key_here",
  "internalOrderId": "64a1b2c3d4e5f6g7h8i9j0k1"
}
```

**Response (Error - 400/401/404):**
```json
{
  "error": "Error message describing the issue"
}
```

**Possible Errors:**
- `Unauthorized` - No auth token provided
- `Order ID is required` - Missing orderId in request
- `Order not found` - Order doesn't exist
- `Forbidden - Order does not belong to this user` - User accessing another user's order
- `Cannot checkout order with status: <status>` - Order already paid or cancelled

### POST /api/payment/verify

**Purpose:** Verify payment signature and confirm order

**Authentication:** Required (JWT token)

**Request Body:**
```json
{
  "razorpayOrderId": "order_IluGWxBJIzG1qE",
  "razorpayPaymentId": "pay_IluGWxBJIzG1qE",
  "razorpaySignature": "9ef4dffbfd84f1318f6739a3ce19f9d85851857ae648f114332d8401e0949a3d",
  "internalOrderId": "64a1b2c3d4e5f6g7h8i9j0k1"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Payment verified and order confirmed",
  "order": {
    "_id": "64a1b2c3d4e5f6g7h8i9j0k1",
    "status": "confirmed",
    "payment": {
      "razorpayOrderId": "order_IluGWxBJIzG1qE",
      "razorpayPaymentId": "pay_IluGWxBJIzG1qE",
      "status": "completed",
      "amount": 500000,
      "currency": "INR"
    }
    // ... other order fields
  }
}
```

**Response (Error - 400):**
```json
{
  "error": "Payment verification failed - Invalid signature"
}
```

**Possible Errors:**
- `Unauthorized` - No auth token provided
- `Missing required payment details` - Missing fields in request
- `Payment verification failed - Invalid signature` - Signature doesn't match
- `Failed to verify payment with Razorpay` - Razorpay API error
- `Payment status is <status>, expected 'captured'` - Payment not successful
- `Order not found` - Order doesn't exist
- `Forbidden - Order does not belong to this user` - User accessing another user's order

## Troubleshooting

### "Razorpay keys not configured" Error

**Problem:** Application throws error about missing Razorpay keys

**Solution:**
1. Check `.env.local` file exists in project root
2. Verify `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are set
3. Make sure values don't have extra quotes or spaces
4. Restart development server after changing `.env.local`
5. Check your browser console for errors

### "Payment verification failed - Invalid signature" Error

**Problem:** Payment succeeds but signature verification fails on backend

**Possible Causes:**
- Razorpay keys don't match between frontend and backend
- Key Secret was accidentally changed
- Signature was modified during transmission

**Solution:**
1. Verify `RAZORPAY_KEY_SECRET` in `.env.local`
2. Check Razorpay dashboard for correct secret
3. Make sure using Test Mode keys for development
4. Check browser console for any JavaScript errors
5. Restart development server

### Razorpay Modal Doesn't Open

**Problem:** Clicking "Pay with Razorpay" button does nothing

**Possible Causes:**
- Razorpay script not loaded
- JavaScript error in checkout page
- Wrong Razorpay Key ID format

**Solution:**
1. Check browser console for errors
2. Verify Key ID is correct in `.env.local`
3. Check that Razorpay script loaded (look for `<script>` in Network tab)
4. Make sure popup blocker isn't blocking modal
5. Try a different browser

### "Failed to create checkout" Error

**Problem:** Getting error when clicking "Pay with Razorpay"

**Solution:**
1. Check browser console for detailed error
2. Verify order exists and belongs to logged-in user
3. Check `/api/checkout` response in Network tab
4. Verify Razorpay API keys in `.env.local`
5. Check server logs for backend errors

### Payment Verified but Order Not Updated

**Problem:** Payment succeeded in Razorpay but order status isn't "confirmed"

**Solution:**
1. Check `/api/payment/verify` response in Network tab
2. Look for error in Network response
3. Verify order ID is correct
4. Check MongoDB to see if order was updated
5. Check server logs for any errors
6. Manually verify order status via admin panel

### Test Credentials Not Working

**Problem:** Test card is being declined

**Possible Causes:**
- Not in Test Mode on Razorpay
- Using wrong test card details
- Using expired test card

**Solution:**
1. Verify Test Mode is active (check toggle in Razorpay dashboard)
2. Use exact test card: `4111 1111 1111 1111`
3. Use future expiry date (e.g., `12/25`)
4. Use any 3-digit CVV (e.g., `123`)
5. Try different OTP (e.g., `123456`)

## Security Notes

### Never Share Your Keys

- **Key ID**: Used in frontend (less sensitive)
- **Key Secret**: Should NEVER be exposed in frontend code
  - Only used on backend
  - Never commit to public repositories
  - Never include in client-side JavaScript

### Signature Verification

The backend verifies payment signatures using HMAC-SHA256:

```typescript
const body = `${razorpayOrderId}|${razorpayPaymentId}`;
const expectedSignature = crypto
  .createHmac('sha256', keySecret)
  .update(body)
  .digest('hex');

// Constant-time comparison prevents timing attacks
const isValid = crypto.timingSafeEqual(
  Buffer.from(razorpaySignature),
  Buffer.from(expectedSignature)
);
```

This ensures:
- Payment data wasn't modified in transit
- Response came from Razorpay (not an attacker)
- Payment amount matches what was requested

### Environment Variables

- `.env.local` is in `.gitignore` and won't be committed
- Always use different keys for Test and Live modes
- Rotate keys periodically for security
- Never share `.env.local` file with others

### HTTPS in Production

- Always use HTTPS for production deployment
- Payment verification requires secure connection
- Razorpay requires HTTPS for live mode

### Best Practices

1. **Never trust client-side values**
   - Always verify order amount on backend
   - Always verify order belongs to authenticated user
   - Always verify Razorpay signature

2. **Log important events**
   - Log failed signature verification attempts
   - Log payment verification responses
   - Monitor for suspicious patterns

3. **Error handling**
   - Don't expose sensitive data in error messages
   - Log full errors on backend for debugging
   - Show user-friendly messages in UI

4. **Testing**
   - Always test with Test Mode keys first
   - Test failure scenarios
   - Test edge cases (network errors, timeouts)

## Migration to Live Mode

When ready for production:

1. **Get Live Keys:**
   - Log in to Razorpay Dashboard
   - Go to Settings → API Keys
   - Toggle to "Live Mode"
   - Copy Live Mode Key ID and Key Secret

2. **Update Environment Variables:**
   ```env
   RAZORPAY_KEY_ID=<your-live-key-id>
   RAZORPAY_KEY_SECRET=<your-live-key-secret>
   ```

3. **Update Checkout Page (Optional):**
   - Change test card notice if desired
   - Update payment method descriptions
   - Ensure currency matches your region

4. **Deploy:**
   - Deploy application with new keys
   - Test with real payment on staging first
   - Monitor transaction logs closely

5. **Verify:**
   - Check Razorpay Dashboard for transactions
   - Verify emails are configured
   - Test refund functionality
   - Setup webhook for notifications

## Webhooks (Optional)

For production, consider implementing webhooks:

1. **Enable Webhooks:**
   - Razorpay Dashboard → Settings → Webhooks
   - Add webhook URL: `https://yourdomain.com/api/payment/webhook`

2. **Handle Events:**
   - `payment.authorized` - Payment captured
   - `payment.failed` - Payment failed
   - `payment.refunded` - Payment refunded

3. **Webhook Verification:**
   - Verify webhook signature (similar to payment verification)
   - Update order status based on webhook event
   - Idempotent webhook handling (same event twice = no double action)

## Resources

- [Razorpay Official Documentation](https://razorpay.com/docs/)
- [Razorpay API Reference](https://razorpay.com/docs/api/)
- [Payment Gateway Testing Guide](https://razorpay.com/docs/payments/payments-dashboard/test-mode/)
- [Razorpay Dashboard](https://dashboard.razorpay.com/)
- [Support - Contact Razorpay](https://razorpay.com/support/)

## FAQ

**Q: Can I use same keys for multiple apps?**  
A: Yes, but it's recommended to have separate keys per environment (dev, staging, production).

**Q: What if a payment is verified but order update fails?**  
A: The payment is still captured in Razorpay. You can manually update the order via admin panel or API.

**Q: How long are test transactions available?**  
A: Test transactions are retained for 30 days before being deleted.

**Q: Can I refund a payment?**  
A: Yes, through Razorpay Dashboard or via API. Frontend refund functionality can be added separately.

**Q: What's the transaction fee?**  
A: Check Razorpay pricing page for current rates. Typically 2-3% + per transaction fee.

**Q: Do I need to handle currency conversion?**  
A: No, amounts are always in the smallest unit (paise for INR).

---

**Last Updated:** January 2025  
**Version:** 1.0  
**Maintainer:** Development Team
