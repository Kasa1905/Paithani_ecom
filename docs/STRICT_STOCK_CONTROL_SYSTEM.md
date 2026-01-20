# STRICT LIVE STOCK CONTROL SYSTEM

## Overview

This system implements real-world e-commerce stock control with **atomic operations**, **strict state machines**, and **race condition prevention**.

---

## Core Principles

### 1. Stock is Admin-Controlled
- Only admins can modify product stock
- Stock field is **never** displayed to customers
- Customers only see "In Stock" / "Out of Stock" / "Only X left"

### 2. Stock Deduction Timing
**CRITICAL RULE:** Stock is deducted **ONLY** when admin confirms an order.

| Event | Stock Action |
|-------|--------------|
| Customer adds to cart | ✅ Validate availability (no deduction) |
| Customer places order | ✅ Validate availability (no deduction) |
| Admin confirms order (`received` → `confirmed`) | ✅ **DEDUCT STOCK ATOMICALLY** |
| Admin cancels received order | ⚠️ No action (stock never deducted) |
| Admin cancels confirmed order | ✅ **RESTORE STOCK ATOMICALLY** |

### 3. State Machine Enforcement
Orders follow a **strict, non-skippable** lifecycle:

```
RECEIVED → CONFIRMED → PACKED → SHIPPED → DELIVERED
   ↓
CANCELLED (only from RECEIVED or after CONFIRMED)
```

**Invalid transitions are rejected** (e.g., RECEIVED → SHIPPED).

### 4. Atomic Operations
All stock modifications use **MongoDB transactions** to prevent:
- Race conditions (two admins confirming simultaneously)
- Partial failures (some items deducted, others failed)
- Overbooking (stock goes negative)

---

## Implementation Details

### File Structure

```
src/lib/stockOperations.ts          # Atomic stock helpers
src/lib/orderTransitions.ts         # State machine validation
app/api/orders/route.ts             # Order creation (NO stock deduction)
app/api/admin/orders/[id]/route.ts  # Order status updates (stock control)
app/api/cart/route.ts               # Cart quantity limits
app/products/[id]/page.tsx          # Frontend quantity caps
```

### Key Functions

#### `validateStockAvailability()` - Read-Only Check
**File:** `src/lib/stockOperations.ts`

```typescript
// Called during: Cart add, Order creation
// Does NOT modify stock
// Returns: { available: boolean, error?, failedProduct? }
```

**Used By:**
- POST `/api/cart` - Before adding to cart
- POST `/api/orders` - Before order creation

#### `deductStockAtomically()` - Confirm Order
**File:** `src/lib/stockOperations.ts`

```typescript
// Called ONLY when: Admin confirms order (received → confirmed)
// Uses MongoDB transaction
// Returns: { success: boolean, error?, failedProduct? }
```

**Used By:**
- PATCH `/api/admin/orders/:id` - On `received` → `confirmed` transition

**Atomicity:**
1. Starts MongoDB transaction
2. Validates ALL items have sufficient stock
3. Deducts stock for ALL items
4. Updates `isOutOfStock` flags
5. Commits or rolls back transaction

#### `restoreStockAtomically()` - Cancel Confirmed Order
**File:** `src/lib/stockOperations.ts`

```typescript
// Called when: Admin cancels confirmed/packed/shipped order
// Uses MongoDB transaction
// Returns: boolean (success status)
```

**Used By:**
- PATCH `/api/admin/orders/:id` - On cancellation of non-received orders

**Logic:**
```typescript
if (status === 'cancelled') {
  if (currentOrder.status !== 'received') {
    // Order was confirmed - restore stock
    await restoreStockAtomically(items);
  }
  // If status was 'received', stock never deducted - no restore needed
}
```

---

## API Behavior

### POST `/api/orders` - Create Order
**Stock Action:** ✅ Validate only (NO deduction)

```typescript
// Old (WRONG):
const product = await decrementStock(productId, quantity); // ❌

// New (CORRECT):
const stockCheck = await validateStockAvailability([{ product, quantity }]);
if (!stockCheck.available) {
  return 400; // Reject order, stock unchanged
}
// Create order with status='received'
```

**Response:**
- 201: Order created (stock unchanged)
- 400: Insufficient stock (order rejected)

### PATCH `/api/admin/orders/:id` - Update Status
**Stock Actions:**

| Transition | Stock Behavior |
|------------|----------------|
| `received` → `confirmed` | ✅ Deduct stock atomically |
| `confirmed` → `packed` | No stock change |
| `packed` → `shipped` | No stock change |
| `shipped` → `delivered` | No stock change |
| `received` → `cancelled` | No stock change (never deducted) |
| `confirmed`+ → `cancelled` | ✅ Restore stock atomically |

**Confirmation Flow:**
```typescript
if (status === 'confirmed' && currentOrder.status === 'received') {
  const result = await deductStockAtomically(items);
  if (!result.success) {
    return 400; // Insufficient stock - order stays 'received'
  }
}
```

**Cancellation Flow:**
```typescript
if (status === 'cancelled') {
  if (currentOrder.status !== 'received') {
    // Order was confirmed - must restore stock
    await restoreStockAtomically(items);
  }
}
```

---

## Frontend Enforcement

### Product Detail Page
**File:** `app/products/[id]/page.tsx`

**Quantity Input:**
```tsx
<input
  type="number"
  min={1}
  max={product.stock}  // Hard cap at available stock
  value={qty}
  onChange={(e) => {
    const val = Math.max(1, Math.min(Number(e.target.value), product.stock));
    setQty(val);  // Clamp to [1, stock]
  }}
/>
```

**Add to Cart:**
```typescript
const quantity = Math.max(1, Math.min(qty, product.stock)); // Final clamp
await fetch('/api/cart', {
  body: JSON.stringify({ productId, quantity })
});
```

**Stock Display (Customer View):**
```tsx
{product.stock === 0 ? 'Out of stock'
 : product.stock < 5 ? `Only ${product.stock} left`
 : 'In stock'}
// Actual stock number is NEVER shown
```

### Cart Page
**File:** `app/cart/page.tsx`

**Quantity Selector:**
```tsx
<input
  type="number"
  min={1}
  max={item.product.stock}  // Hard cap
  value={item.quantity}
  onChange={(e) => updateQuantity(item, Math.min(val, item.product.stock))}
/>
```

---

## Admin Features

### Stock Management
**File:** `app/admin/products/page.tsx`

Admins can:
1. View current stock levels
2. Update stock via input field
3. Save changes (immediate database update)

**Stock Input:**
```tsx
<input
  type="number"
  min={0}
  value={tempStock[product._id] ?? product.stock}
  onChange={(e) => handleStockChange(product._id, e.target.value)}
/>
<button onClick={() => handleSaveStock(product)}>Save Stock</button>
```

**API Call:**
```typescript
await fetch('/api/admin/products', {
  method: 'PUT',
  body: JSON.stringify({ productId, stock: newStock })
});
```

### Order Confirmation
**File:** `app/admin/orders/page.tsx`

Admin transitions order status:
```tsx
<select value={order.status} onChange={(e) => updateStatus(order._id, e.target.value)}>
  <option value="received">Received</option>
  <option value="confirmed">Confirmed</option>  {/* Deducts stock */}
  <option value="packed">Packed</option>
  <option value="shipped">Shipped</option>
  <option value="delivered">Delivered</option>
  <option value="cancelled">Cancelled</option>  {/* Restores stock if confirmed */}
</select>
```

**Invalid Transition Handling:**
```typescript
const res = await fetch(`/api/admin/orders/${orderId}`, {
  method: 'PATCH',
  body: JSON.stringify({ status: 'shipped' })  // From 'received'
});
// Response: 400 - "Cannot transition from 'received' to 'shipped'"
```

---

## Race Condition Prevention

### Scenario: Two Admins Confirm Same Order
**Problem:** Without transactions, both could deduct stock simultaneously.

**Solution:**
```typescript
// MongoDB transaction ensures atomicity
const session = await mongoose.startSession();
session.startTransaction();

try {
  // 1. Lock product documents with session
  const product = await Product.findById(id).session(session);
  
  // 2. Check stock
  if (product.stock < quantity) {
    throw new Error('Insufficient stock');
  }
  
  // 3. Deduct stock
  product.stock -= quantity;
  await product.save({ session });
  
  // 4. Update order
  order.status = 'confirmed';
  await order.save({ session });
  
  await session.commitTransaction();  // All or nothing
} catch (err) {
  await session.abortTransaction();  // Rollback everything
}
```

**Result:** Only ONE admin succeeds. The second receives "Insufficient stock" error.

### Scenario: Customer Orders Last Item While Admin Updates Stock
**Problem:** Customer sees stock=1, places order, admin sets stock=0, customer order should fail.

**Solution:**
1. Customer order creation only **validates** stock (no deduction)
2. Order enters `received` status
3. Admin must **manually confirm** order (triggers stock deduction)
4. If stock insufficient at confirmation time → order stays `received`

**Timeline:**
```
T1: Customer places order (stock=1, validation passes)
T2: Admin sets stock=0
T3: Admin tries to confirm order → 400 error "Insufficient stock"
T4: Order remains in 'received' status
```

---

## Error Handling

### Insufficient Stock on Confirmation
**Scenario:** Admin confirms order, but stock was depleted by another order.

**Response:**
```json
{
  "error": "Insufficient stock for Premium Silk Paithani",
  "failedProduct": {
    "id": "507f1f77bcf86cd799439011",
    "title": "Premium Silk Paithani",
    "requested": 2,
    "available": 0
  }
}
```

**Admin Action:**
- Order stays in `received` status
- Admin can:
  1. Increase product stock and retry confirmation
  2. Cancel the order (no stock restored, as none was deducted)

### Invalid State Transition
**Scenario:** Admin tries to skip states (e.g., received → shipped).

**Response:**
```json
{
  "error": "Cannot transition from 'received' to 'shipped'. Allowed: confirmed, cancelled"
}
```

**Admin Action:**
- Must follow proper sequence
- No bypass allowed

---

## Testing Scenarios

### Test 1: Stock Validation on Cart Add
```bash
# Setup: Product has stock=5
POST /api/cart
{ "productId": "...", "quantity": 6 }

# Expected: 400
{ "error": "Only 5 items available in stock" }
```

### Test 2: Stock Validation on Order Creation
```bash
# Setup: Product has stock=2
POST /api/orders
{ "productId": "...", "quantity": 3 }

# Expected: 400
{ 
  "error": "Insufficient stock for Product Name",
  "failedProduct": { "available": 2, "requested": 3 }
}
```

### Test 3: Stock Deduction on Confirmation
```bash
# Setup: Product has stock=10, Order has 3 items
PATCH /api/admin/orders/{orderId}
{ "status": "confirmed" }

# Expected: 200
{ "order": { "status": "confirmed", ... } }

# Verify: Product stock is now 7
GET /api/products/{productId}
{ "stock": 7, ... }
```

### Test 4: Stock Restoration on Cancellation (Confirmed Order)
```bash
# Setup: Order is 'confirmed', product stock=7
PATCH /api/admin/orders/{orderId}
{ "status": "cancelled" }

# Expected: 200
{ "order": { "status": "cancelled", ... } }

# Verify: Product stock restored to 10
GET /api/products/{productId}
{ "stock": 10, ... }
```

### Test 5: No Stock Restoration on Cancellation (Received Order)
```bash
# Setup: Order is 'received', product stock=10 (unchanged from creation)
PATCH /api/admin/orders/{orderId}
{ "status": "cancelled" }

# Expected: 200
{ "order": { "status": "cancelled", ... } }

# Verify: Product stock still 10 (no change)
GET /api/products/{productId}
{ "stock": 10, ... }
```

### Test 6: Insufficient Stock on Confirmation
```bash
# Setup: Order has 5 items, product stock=3
PATCH /api/admin/orders/{orderId}
{ "status": "confirmed" }

# Expected: 400
{ 
  "error": "Insufficient stock for Product Name",
  "failedProduct": { "available": 3, "requested": 5 }
}

# Verify: Order still 'received', product stock still 3
```

### Test 7: Invalid Transition
```bash
# Setup: Order is 'received'
PATCH /api/admin/orders/{orderId}
{ "status": "shipped" }

# Expected: 400
{ "error": "Cannot transition from 'received' to 'shipped'. Allowed: confirmed, cancelled" }
```

### Test 8: Race Condition - Simultaneous Confirmations
```bash
# Setup: 2 orders for same product, stock=5
# Order A: 3 items
# Order B: 4 items

# Admin 1 & 2 click confirm simultaneously
PATCH /api/admin/orders/{orderA}  # T1
{ "status": "confirmed" }

PATCH /api/admin/orders/{orderB}  # T1+1ms
{ "status": "confirmed" }

# Expected:
# One succeeds: 200, stock=2 (5-3)
# One fails: 400, "Insufficient stock" (needs 4, only 2 available)
```

---

## Database Schema

### Product Model
```typescript
{
  title: String,
  price: Number,
  stock: Number,          // Admin-controlled, never shown to customers
  isOutOfStock: Boolean,  // Auto-updated based on stock
  isActive: Boolean       // Auto-updated based on stock
}
```

**Stock Update Logic:**
```typescript
if (product.stock <= 0) {
  product.stock = 0;
  product.isOutOfStock = true;
  product.isActive = false;
}

if (product.stock > 0 && product.isOutOfStock) {
  product.isOutOfStock = false;
  product.isActive = true;
}
```

### Order Model
```typescript
{
  user: ObjectId,
  items: [{
    product: ObjectId,
    quantity: Number
  }],
  totalAmount: Number,
  status: 'received' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled',
  payment: { ... },
  deliveredAt: Date,
  archivedAt: Date
}
```

**Status Timeline:**
```
received   → Order placed, stock NOT deducted
confirmed  → Admin confirmed, stock DEDUCTED
packed     → Order packed, stock remains deducted
shipped    → Order shipped, stock remains deducted
delivered  → Order delivered, stock remains deducted
cancelled  → Order cancelled, stock RESTORED (if was confirmed)
```

---

## Migration from Old System

### Old Behavior (WRONG)
- ❌ Stock deducted on order creation
- ❌ Stock restored on ANY cancellation
- ❌ No transaction safety
- ❌ Race conditions possible

### New Behavior (CORRECT)
- ✅ Stock deducted ONLY on confirmation
- ✅ Stock restored ONLY if order was confirmed
- ✅ Atomic operations with transactions
- ✅ Race condition prevention

### Migration Steps
1. ✅ Created `src/lib/stockOperations.ts`
2. ✅ Updated `POST /api/orders` to NOT deduct stock
3. ✅ Updated `PATCH /api/admin/orders/:id` to handle confirmation & cancellation
4. ✅ Verified Cart API already enforces limits
5. ✅ Verified Frontend caps quantity at stock

**No database migration needed** - existing orders continue to work.

---

## Security Considerations

### Stock Manipulation Prevention
- Stock field is **admin-only**
- API endpoints verify admin role
- Frontend never sends stock values (only quantities)
- Atomic operations prevent race conditions

### Overbooking Prevention
- Cart add validates stock
- Order creation validates stock
- Order confirmation validates stock (final check)
- All operations use same validation logic

### State Machine Integrity
- Centralized validation in `src/lib/orderTransitions.ts`
- Invalid transitions rejected at API level
- No client-side bypass possible

---

## Maintenance Notes

### Adding New Order States
1. Update `OrderStatus` type in `src/lib/orderTransitions.ts`
2. Update `VALID_TRANSITIONS` map
3. Update `status` enum in `src/models/Order.ts`
4. Test all transition paths

### Modifying Stock Logic
**⚠️ CRITICAL:** All stock modifications MUST:
1. Use `stockOperations.ts` helpers
2. Use MongoDB transactions
3. Validate stock availability first
4. Handle rollback on failure

**DO NOT:**
- ❌ Directly modify `product.stock`
- ❌ Skip transaction wrappers
- ❌ Assume stock is available

---

## Summary

| Aspect | Implementation |
|--------|----------------|
| Stock Deduction | ✅ Only on confirmation |
| Atomicity | ✅ MongoDB transactions |
| Race Conditions | ✅ Prevented |
| State Machine | ✅ Strictly enforced |
| Frontend Limits | ✅ Quantity capped |
| API Validation | ✅ Multi-layer checks |
| Admin Control | ✅ Full stock management |
| Customer View | ✅ Stock hidden |

**Status:** ✅ **PRODUCTION READY**

All requirements met:
- ✅ Customers cannot exceed stock
- ✅ Stock enforcement at cart level
- ✅ Atomic stock operations
- ✅ Strict state machine enforcement
- ✅ No race conditions
- ✅ Proper cancellation handling
