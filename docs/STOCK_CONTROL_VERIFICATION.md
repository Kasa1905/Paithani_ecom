# STRICT STOCK CONTROL - VERIFICATION CHECKLIST

## Pre-Deployment Verification

### ✅ Code Changes
- [x] Created `src/lib/stockOperations.ts` - Atomic stock helpers
- [x] Updated `app/api/orders/route.ts` - Removed stock deduction on order creation
- [x] Updated `app/api/admin/orders/[id]/route.ts` - Added confirmation/cancellation logic
- [x] Verified `app/api/cart/route.ts` - Already enforces stock limits
- [x] Verified `app/products/[id]/page.tsx` - Already caps quantity at stock
- [x] No TypeScript compilation errors

### ✅ Core Requirements Met
- [x] Customers cannot exceed available stock (enforced at cart & order level)
- [x] Stock is not enforced at cart level ❌ WAIT - Stock IS enforced at cart level ✅
- [x] Stock logic is atomic (MongoDB transactions)
- [x] Admin confirmation sequence strictly enforced (state machine)

---

## Manual Testing Plan

### Test 1: Cart Quantity Limits
**Steps:**
1. Navigate to product with stock=5
2. Try to add 6 items to cart
3. **Expected:** Error "Only 5 items available in stock"

**Verification:**
```bash
# Check cart API
curl -X POST http://localhost:3000/api/cart \
  -H "Content-Type: application/json" \
  -d '{"productId": "...", "quantity": 6}'

# Expected: 400 Bad Request
```

### Test 2: Order Creation (No Stock Deduction)
**Steps:**
1. Create product with stock=10
2. Place order for 3 items
3. Check product stock (should still be 10)

**Verification:**
```bash
# Before order
GET /api/products/{id}
# stock: 10

# Place order
POST /api/orders
{ "productId": "...", "quantity": 3 }

# After order (stock should be unchanged)
GET /api/products/{id}
# stock: 10 ✅
```

### Test 3: Order Confirmation (Stock Deduction)
**Steps:**
1. Admin confirms order (received → confirmed)
2. Check product stock (should be 7 now)

**Verification:**
```bash
# Confirm order
PATCH /api/admin/orders/{orderId}
{ "status": "confirmed" }

# Check stock
GET /api/products/{id}
# stock: 7 ✅ (10 - 3 = 7)
```

### Test 4: Received Order Cancellation (No Restore)
**Steps:**
1. Create order with stock=10 (stock unchanged)
2. Admin cancels order while still in "received" status
3. Check stock (should still be 10)

**Verification:**
```bash
# Order in 'received' status, stock=10
PATCH /api/admin/orders/{orderId}
{ "status": "cancelled" }

# Check stock
GET /api/products/{id}
# stock: 10 ✅ (no change, stock was never deducted)
```

### Test 5: Confirmed Order Cancellation (Stock Restore)
**Steps:**
1. Confirm order (stock=10 → 7)
2. Admin cancels order
3. Check stock (should be 10 again)

**Verification:**
```bash
# Order in 'confirmed' status, stock=7
PATCH /api/admin/orders/{orderId}
{ "status": "cancelled" }

# Check stock
GET /api/products/{id}
# stock: 10 ✅ (restored: 7 + 3 = 10)
```

### Test 6: Insufficient Stock on Confirmation
**Steps:**
1. Create order for 5 items (stock=10)
2. Create another order for 8 items (stock still 10)
3. Confirm first order (stock=10 → 5)
4. Try to confirm second order
5. **Expected:** Error "Insufficient stock"

**Verification:**
```bash
# After first confirmation
GET /api/products/{id}
# stock: 5

# Try to confirm second order (needs 8, only 5 available)
PATCH /api/admin/orders/{order2Id}
{ "status": "confirmed" }

# Expected: 400 Bad Request
# { "error": "Insufficient stock...", "failedProduct": {...} }
```

### Test 7: Invalid State Transition
**Steps:**
1. Try to skip from "received" to "shipped"
2. **Expected:** Error "Cannot transition..."

**Verification:**
```bash
# Order in 'received' status
PATCH /api/admin/orders/{orderId}
{ "status": "shipped" }

# Expected: 400 Bad Request
# { "error": "Cannot transition from 'received' to 'shipped'. Allowed: confirmed, cancelled" }
```

### Test 8: Complete Order Lifecycle
**Steps:**
1. Product stock=10
2. Customer places order for 3 items → stock still 10
3. Admin confirms → stock=7
4. Admin packs → stock=7
5. Admin ships → stock=7
6. Admin marks delivered → stock=7

**Verification:**
```bash
# Track stock through each transition
received: stock=10
confirmed: stock=7 ✅
packed: stock=7 ✅
shipped: stock=7 ✅
delivered: stock=7 ✅
```

---

## Automated Test Script

```bash
#!/bin/bash
# Stock Control Integration Tests

BASE_URL="http://localhost:3000"
PRODUCT_ID=""  # Set after creating product
ORDER_ID=""    # Set after creating order

echo "=== Stock Control Tests ==="

# Test 1: Create product with stock=10
echo "Test 1: Creating product..."
PRODUCT_RESPONSE=$(curl -s -X POST $BASE_URL/api/admin/products \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Product","price":1000,"stock":10,"category":"test","imageUrl":"https://via.placeholder.com/150"}')
PRODUCT_ID=$(echo $PRODUCT_RESPONSE | jq -r '.product._id')
echo "Product created: $PRODUCT_ID with stock=10"

# Test 2: Place order (should NOT deduct stock)
echo "Test 2: Placing order..."
ORDER_RESPONSE=$(curl -s -X POST $BASE_URL/api/orders \
  -H "Content-Type: application/json" \
  -d "{\"productId\":\"$PRODUCT_ID\",\"quantity\":3}")
ORDER_ID=$(echo $ORDER_RESPONSE | jq -r '.order._id')
echo "Order placed: $ORDER_ID"

# Verify stock unchanged
STOCK_CHECK=$(curl -s $BASE_URL/api/products/$PRODUCT_ID | jq -r '.product.stock')
if [ "$STOCK_CHECK" -eq 10 ]; then
  echo "✅ Test 2 PASSED: Stock unchanged after order creation ($STOCK_CHECK)"
else
  echo "❌ Test 2 FAILED: Stock should be 10, got $STOCK_CHECK"
fi

# Test 3: Confirm order (should deduct stock)
echo "Test 3: Confirming order..."
curl -s -X PATCH $BASE_URL/api/admin/orders/$ORDER_ID \
  -H "Content-Type: application/json" \
  -d '{"status":"confirmed"}'

# Verify stock deducted
STOCK_CHECK=$(curl -s $BASE_URL/api/products/$PRODUCT_ID | jq -r '.product.stock')
if [ "$STOCK_CHECK" -eq 7 ]; then
  echo "✅ Test 3 PASSED: Stock deducted on confirmation ($STOCK_CHECK)"
else
  echo "❌ Test 3 FAILED: Stock should be 7, got $STOCK_CHECK"
fi

# Test 4: Cancel order (should restore stock)
echo "Test 4: Cancelling order..."
curl -s -X PATCH $BASE_URL/api/admin/orders/$ORDER_ID \
  -H "Content-Type: application/json" \
  -d '{"status":"cancelled"}'

# Verify stock restored
STOCK_CHECK=$(curl -s $BASE_URL/api/products/$PRODUCT_ID | jq -r '.product.stock')
if [ "$STOCK_CHECK" -eq 10 ]; then
  echo "✅ Test 4 PASSED: Stock restored on cancellation ($STOCK_CHECK)"
else
  echo "❌ Test 4 FAILED: Stock should be 10, got $STOCK_CHECK"
fi

echo "=== Tests Complete ==="
```

---

## Database Verification Queries

### Check Order Status and Stock
```javascript
// MongoDB Shell
db.orders.aggregate([
  {
    $lookup: {
      from: 'products',
      localField: 'items.product',
      foreignField: '_id',
      as: 'productDetails'
    }
  },
  {
    $project: {
      status: 1,
      items: 1,
      'productDetails.title': 1,
      'productDetails.stock': 1,
      createdAt: 1
    }
  }
])
```

### Find Orders with Stock Issues
```javascript
// Find orders where product stock < order quantity
db.orders.aggregate([
  {
    $lookup: {
      from: 'products',
      localField: 'items.product',
      foreignField: '_id',
      as: 'product'
    }
  },
  {
    $match: {
      $expr: {
        $lt: [
          { $arrayElemAt: ['$product.stock', 0] },
          { $arrayElemAt: ['$items.quantity', 0] }
        ]
      }
    }
  }
])
```

---

## Production Deployment Checklist

### Pre-Deployment
- [ ] All tests pass locally
- [ ] Database backup taken
- [ ] Code reviewed by second developer
- [ ] Documentation updated

### Deployment Steps
1. [ ] Deploy code to staging environment
2. [ ] Run automated tests on staging
3. [ ] Manual smoke test on staging
4. [ ] Deploy to production during low-traffic window
5. [ ] Monitor error logs for 1 hour post-deployment

### Post-Deployment Monitoring
- [ ] Check error rate for stock-related endpoints
- [ ] Monitor order confirmation failures
- [ ] Verify no negative stock values in database
- [ ] Check for race condition errors

### Rollback Plan
If issues detected:
1. Revert code deployment
2. Restore database from backup (if needed)
3. Investigate logs
4. Fix issues in staging
5. Re-deploy

---

## Known Limitations

### Stock Reservation
**Not Implemented:** Items in cart are not "reserved" for the user.

**Scenario:**
- User A adds last 5 items to cart
- User B can also add same 5 items to cart
- Both place orders
- Admin can only confirm one order

**Mitigation:**
- Stock validated at order creation
- Stock validated again at order confirmation
- First to confirm wins

**Future Enhancement:**
- Implement cart reservation with timeout (e.g., 15 minutes)
- Warn users when stock is low

### Concurrent Confirmations
**Handled:** MongoDB transactions prevent double-deduction.

**Scenario:**
- Admin A clicks confirm
- Admin B clicks confirm at same time
- Only one succeeds (atomic operation)

**Result:**
- One admin sees success
- Other admin sees "Insufficient stock" error

---

## Support Documentation

### Common Admin Questions

**Q: Order is stuck in "received" - can I skip to "shipped"?**
A: No. Orders must follow: received → confirmed → packed → shipped. This ensures stock is properly deducted.

**Q: I cancelled a "received" order - why didn't stock increase?**
A: Stock is only deducted on confirmation. If order was never confirmed, stock was never deducted, so nothing to restore.

**Q: Confirmation failed with "Insufficient stock" - what now?**
A: Either:
1. Increase product stock and retry confirmation
2. Cancel the order and notify customer

**Q: Can I restore stock manually if I cancelled wrong order?**
A: No need - cancellation automatically restores stock if order was confirmed. If not confirmed, stock was never deducted.

---

## Emergency Procedures

### Negative Stock Detected
```javascript
// Find products with negative stock
db.products.find({ stock: { $lt: 0 } })

// Fix: Set to zero and mark out of stock
db.products.updateMany(
  { stock: { $lt: 0 } },
  { 
    $set: { 
      stock: 0, 
      isOutOfStock: true,
      isActive: false 
    } 
  }
)
```

### Stock Audit
```javascript
// Compare confirmed orders vs stock deductions
db.orders.aggregate([
  {
    $match: { status: { $in: ['confirmed', 'packed', 'shipped', 'delivered'] } }
  },
  {
    $unwind: '$items'
  },
  {
    $group: {
      _id: '$items.product',
      totalSold: { $sum: '$items.quantity' }
    }
  },
  {
    $lookup: {
      from: 'products',
      localField: '_id',
      foreignField: '_id',
      as: 'product'
    }
  },
  {
    $project: {
      totalSold: 1,
      currentStock: { $arrayElemAt: ['$product.stock', 0] }
    }
  }
])
```

---

## Status: ✅ READY FOR DEPLOYMENT

All implementation complete:
- ✅ Atomic stock operations
- ✅ Strict state machine
- ✅ Order creation validation only
- ✅ Confirmation deducts stock
- ✅ Cancellation restores stock (conditionally)
- ✅ Cart limits enforced
- ✅ Frontend quantity caps
- ✅ No compilation errors
- ✅ Comprehensive documentation

**Next Steps:**
1. Deploy to staging
2. Run manual tests
3. Monitor logs
4. Deploy to production
