# Order Lifecycle & Retention Implementation Guide

## Overview

This implementation enforces a strict order state machine and manages delivered order retention automatically.

## Order State Machine

### Valid Status Transitions

```
received → confirmed → packed → shipped → delivered
    ↓
  cancelled (only from received)
```

### Transition Rules

| Current Status | Allowed Next States | Cancellation Allowed |
|---|---|---|
| `received` | `confirmed`, `cancelled` | ✅ Yes (restores stock) |
| `confirmed` | `packed` | ❌ No |
| `packed` | `shipped` | ❌ No |
| `shipped` | `delivered` | ❌ No |
| `delivered` | (none) | ❌ No |
| `cancelled` | (none) | ❌ No |

### Key Features

1. **No Skipping**: Cannot jump from `received` directly to `packed`
2. **No Backward**: Cannot transition backward (e.g., `shipped` → `packed`)
3. **Terminal States**: `delivered` and `cancelled` cannot be further modified
4. **Stock Restoration**: Cancelling restores all item quantities to product stock

## Centralized Validation

All transition validation is centralized in `@/lib/orderTransitions.ts`:

```typescript
import { validateTransition, getAllowedNextStatuses } from '@/lib/orderTransitions';

// Check if transition is valid
const { valid, error } = validateTransition('received', 'confirmed');

// Get allowed next statuses
const allowed = getAllowedNextStatuses('received'); // ['confirmed', 'cancelled']
```

## Delivered Order Retention

### Automatic Archival

When orders reach the `delivered` status:
1. **Current**: Visible in admin/customer views
2. **After 15 days**: Automatically moved to `archived` state
3. **Forever**: Stored in database (never deleted)

### Timestamp Management

| Field | Purpose | Set When |
|---|---|---|
| `deliveredAt` | Records exact delivery timestamp | Order moves to `delivered` |
| `archivedAt` | Records archival timestamp | Auto-archive after 15 days |
| `createdAt` | Order creation timestamp | Order created |
| `updatedAt` | Last update timestamp | Any status change |

### Automatic Archival Logic

The `applyDeliveredOrderRetention()` function:
- Runs on every fetch of active orders
- Identifies delivered orders older than 15 days
- Sets `archivedAt` timestamp
- Filters them out from default view

## API Endpoints

### Admin Endpoints

#### 1. Get Active Orders (Non-Archived)
```
GET /api/admin/orders
Response: { orders: Order[] }
```

Shows all orders except those with `archivedAt` set. Automatically archives delivered orders older than 15 days.

#### 2. Get Delivered Orders (Last 15 Days)
```
GET /api/admin/orders/delivered
Response: { orders: Order[] }
```

Shows only `delivered` status orders that haven't been archived yet.

#### 3. Get Archived Orders
```
GET /api/admin/orders/archived
Response: { orders: Order[] }
```

Shows all orders with `archivedAt` set (delivered > 15 days ago).

#### 4. Update Order Status
```
PATCH /api/admin/orders/:id
Request: { status: string }
Response: { order: Order }
Errors:
  - "Cannot transition from 'X' to 'Y'" - Invalid transition
  - "Cannot update archived orders" - Archived orders are locked
```

### Customer Endpoints

#### 1. Get Own Orders
```
GET /api/orders
Response: { orders: Order[] }
```

Shows customer's non-archived orders. Displays delivery timestamp for delivered orders.

#### 2. Create Order
```
POST /api/orders
Request: { productId, quantity } or { cartCheckout: true }
Response: { order: Order }
```

Creates order in `received` status with current timestamp.

## Admin UI

### Order Management Page (`/admin/orders`)

Three tabs for different views:

1. **Active Orders** (Default)
   - Shows `received`, `confirmed`, `packed`, `shipped` statuses
   - Excludes archived orders
   - Status dropdown enables next-step transitions only
   - Color-coded status indicators

2. **Delivered (15 days)**
   - Shows `delivered` status orders
   - Only archived if older than 15 days
   - Display only (no transitions possible)
   - Green status indicator

3. **Archived (Old)**
   - Shows orders automatically moved to archived state
   - Locked (no changes allowed)
   - Gray status indicator

### Status Colors

- **Orange** (#ff9800): `received` - Initial state
- **Blue** (#2196f3): `confirmed` - Payment confirmed
- **Purple** (#9c27b0): `packed` - Ready to ship
- **Cyan** (#00bcd4): `shipped` - In transit
- **Green** (#4caf50): `delivered` - Completed
- **Red** (#f44336): `cancelled` - Cancelled

### Visual Indicators

- Left border of order card colored by status
- Status displayed as badge
- Timestamps shown for creation, delivery, and archival

## Customer UI

### Order History Page (`/orders`)

Features:
- Displays all customer orders (excluding archived)
- Color-coded status badges
- Shows delivery timestamp for delivered orders
- No action buttons (view-only)
- Chronologically sorted (newest first)

## Data Safety

### Guarantees

- **No Hard Deletes**: Orders never removed from database
- **Audit Trail**: All timestamps preserved (`createdAt`, `deliveredAt`, `archivedAt`)
- **Transactional**: Stock restoration uses MongoDB sessions
- **Immutability**: Archived orders cannot be modified

### Storage

Orders stored with:
- Original data (items, amounts, payment info)
- Status history (current status, all transition timestamps)
- User reference (for customer lookup)
- Product snapshots (item quantities for reference)

## Implementation Details

### Files Modified

1. **`src/models/Order.ts`**
   - Added `deliveredAt: Date` field
   - Added `archivedAt: Date` field
   - Already had `status` enum

2. **`src/lib/orderTransitions.ts`** (NEW)
   - Centralized transition validation logic
   - Helper functions for status queries

3. **`src/lib/orderRetention.ts`** (EXISTING)
   - Archives delivered orders older than 15 days
   - Runs on every order fetch

4. **`app/api/admin/orders/route.ts`**
   - Uses `applyDeliveredOrderRetention()` on GET
   - Returns only non-archived orders

5. **`app/api/admin/orders/[id]/route.ts`**
   - Uses centralized `validateTransition()`
   - Sets `deliveredAt` on transition to `delivered`
   - Prevents updates to archived orders

6. **`app/api/admin/orders/delivered/route.ts`** (NEW)
   - Returns orders in `delivered` status
   - Excludes archived orders

7. **`app/api/admin/orders/archived/route.ts`** (NEW)
   - Returns orders with `archivedAt` set

8. **`app/api/orders/route.ts`**
   - Uses `applyDeliveredOrderRetention()` on GET
   - Returns customer's non-archived orders

9. **`app/admin/orders/page.tsx`**
   - Tab-based navigation (Active/Delivered/Archived)
   - Status color coding
   - Conditional transition dropdown

10. **`app/orders/page.tsx`**
    - Displays delivery timestamp
    - Status color coding
    - View-only interface

## Testing Checklist

- [ ] Create order → verify status is `received`
- [ ] Confirm order → verify status is `confirmed`
- [ ] Try invalid transition (e.g., `received` → `packed`) → expect error
- [ ] Try backward transition → expect error
- [ ] Move to `delivered` → verify `deliveredAt` is set
- [ ] Cancel at `received` → verify stock restored
- [ ] Try cancel at `shipped` → expect error
- [ ] Mock time forward 15 days → run `/api/admin/orders` → verify auto-archive
- [ ] View delivered orders in tab → verify only `delivered` shown
- [ ] View archived orders → verify only `archivedAt` set shown
- [ ] Try update archived order → expect error

## Future Enhancements

- Export delivered/archived orders to CSV
- Bulk status updates for admin
- Delivery tracking integration
- Order timeline visualization
- Notification on delivery
- Return requests post-delivery
