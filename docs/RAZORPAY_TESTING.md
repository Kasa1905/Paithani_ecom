# Razorpay Payment Testing Checklist

Quick reference guide for testing Razorpay payment integration.

## Pre-Test Setup

- [ ] `.env.local` has `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` (Test Mode keys)
- [ ] Development server is running (`npm run dev`)
- [ ] MongoDB is connected
- [ ] Logged in as a user (not admin)
- [ ] Razorpay Dashboard open in separate tab (for verification)

## Test Scenario 1: Successful Payment

### Test Steps

1. **Add Product to Cart**
   - Navigate to Products page
   - Click "Add to Cart" on any product
   - Verify cart count increases

2. **Create Order**
   - Go to Cart page
   - Click "Proceed to Checkout"
   - Click "Place Order"
   - Order created with status = "received"
   - You're redirected to Orders page

3. **Initiate Payment**
   - Click on the order in "received" status
   - Click "Pay with Razorpay" button
   - Razorpay modal opens

4. **Enter Payment Details**
   - Use Test Card: `4111 1111 1111 1111`
   - Expiry: Any future date (e.g., `12/25`)
   - CVV: Any 3 digits (e.g., `123`)
   - Name: Test User (or any name)

5. **Complete Payment**
   - Click "Pay" button
   - Enter OTP: `123456` (or any 6-digit number)
   - Payment processes and completes

6. **Verify Success**
   - Redirected to Orders page with success message
   - Order status changed to "confirmed"
   - Payment details visible in order
   - Order no longer in "received" status

### Verify in Database

```javascript
// In MongoDB, check the order
db.orders.findOne({_id: ObjectId("...")})

// Should show:
{
  status: "confirmed",
  payment: {
    razorpayOrderId: "order_...",
    razorpayPaymentId: "pay_...",
    razorpaySignature: "...",
    status: "completed",
    amount: 1000000,
    currency: "INR"
  }
}
```

### Verify in Razorpay Dashboard

1. Go to Razorpay Dashboard
2. Navigate to Transactions → Payments
3. Find latest payment (marked "Test Mode")
4. Verify:
   - Status: Captured
   - Amount matches order total
   - Receipt shows your internal order ID

## Test Scenario 2: Payment Failure

### Test Steps

1. Create order (same as Test Scenario 1, steps 1-3)
2. Click "Pay with Razorpay"
3. Use Invalid Card: `4000 0000 0000 0002`
4. Click "Pay"
5. Payment should fail with error message
6. Error message displays on checkout page
7. Order remains in "received" status
8. User can retry payment

### Expected Behavior

- Error message appears on checkout page
- Razorpay modal closes
- No order status change
- User can retry with different payment method

## Test Scenario 3: User Cancels Payment

### Test Steps

1. Create order (same as Test Scenario 1, steps 1-3)
2. Click "Pay with Razorpay"
3. Click "Back" or close modal without paying
4. User returned to checkout page
5. Error message displays: "Payment cancelled by user"

### Expected Behavior

- Order remains in "received" status
- No payment record created
- User can retry payment later

## Test Scenario 4: Multiple Orders and Payments

### Test Steps

1. Create Order 1 (same as Test Scenario 1)
2. Complete payment successfully
3. Verify order status = "confirmed"
4. Create Order 2 (repeat Test Scenario 1 steps 1-2)
5. Complete payment with Test Card
6. Verify both orders have confirmed status

### Expected Behavior

- Both orders have independent payment records
- Each order has unique Razorpay Order ID
- Payment verification works independently

## Test Scenario 5: Order Amount Verification

### Test Steps

1. Add 2 products to cart:
   - Product A: ₹500 x 2 = ₹1000
   - Product B: ₹300 x 3 = ₹900
   - Total: ₹1900

2. Create order
3. Go to checkout page
4. Verify order total shows ₹1900
5. Click "Pay with Razorpay"
6. Verify Razorpay modal shows amount: ₹1900
7. Complete payment
8. Verify database amount: 190000 paise

### Expected Behavior

- Amount consistent across all stages
- Converted to paise correctly (₹1900 = 190000 paise)

## Browser Console Checks

While testing, monitor browser console for:

- ✅ No JavaScript errors
- ✅ Razorpay script loaded successfully
- ✅ Payment response logged (contains payment details)
- ✅ Signature verification logged
- ✅ Order update logged

## Network Tab Checks

Check Network tab while testing:

1. **POST /api/checkout**
   - Status: 200
   - Response includes razorpayOrderId and keyId

2. **POST /api/payment/verify**
   - Status: 200
   - Response includes order with status "confirmed"
   - No errors in response body

## Common Issues During Testing

### Issue: "Razorpay keys not configured"

- Check `.env.local` has both keys
- Restart development server after adding keys
- Check for typos in key names

### Issue: Razorpay Modal Doesn't Open

- Check browser console for errors
- Verify Key ID is correct
- Make sure you're not in incognito with strict popup blocking
- Try different browser

### Issue: Payment Verified but Order Not Updated

- Check Network tab for `/api/payment/verify` response
- Verify no errors in response body
- Check MongoDB directly if order was updated
- Check server logs for errors

### Issue: "Invalid signature" Error

- Verify Key Secret is correct
- Make sure not using Live Mode keys in Test Mode
- Check that signature wasn't modified
- Restart server after changing keys

## Success Checklist

After completing all tests, verify:

- [ ] Test Scenario 1 (Successful Payment) - ✅ Passed
- [ ] Test Scenario 2 (Payment Failure) - ✅ Passed
- [ ] Test Scenario 3 (User Cancels) - ✅ Passed
- [ ] Test Scenario 4 (Multiple Orders) - ✅ Passed
- [ ] Test Scenario 5 (Amount Verification) - ✅ Passed
- [ ] Browser console has no errors
- [ ] Network requests succeed (200 status)
- [ ] Database updated correctly
- [ ] Razorpay Dashboard shows transactions
- [ ] Payment signatures verified securely

## Production Readiness Checklist

Before deploying to production:

- [ ] Switched to Live Mode keys
- [ ] Updated `.env` with live credentials
- [ ] Tested with real payment (small amount)
- [ ] Verified HTTPS is enabled
- [ ] Verified webhook configuration (if using)
- [ ] Tested refund functionality
- [ ] Setup monitoring and alerts
- [ ] Documented support process for payment issues
- [ ] Tested error scenarios
- [ ] Verified email notifications work

## Useful Commands

**Clear Database (for fresh testing):**
```bash
# Remove test orders
db.orders.deleteMany({})

# Keep products and users
```

**Restart Development Server:**
```bash
# Kill current server
Ctrl + C

# Restart
npm run dev
```

**View Recent Orders:**
```bash
db.orders.find({}).sort({createdAt: -1}).limit(5)
```

**Check Razorpay Service Logs:**
```bash
# Look in app logs for any Razorpay errors
grep -i "razorpay" server-logs.txt
```

---

**Quick Links:**
- Razorpay Dashboard: https://dashboard.razorpay.com/
- Razorpay Docs: https://razorpay.com/docs/
- App Checkout Page: http://localhost:3000/checkout
- Orders Page: http://localhost:3000/orders

**Last Updated:** January 2025
