# ORDER ARCHIVING SYSTEM

## Overview
Automatic order archiving system with a strict 15-day rule. Separates active orders from historical orders without data deletion.

## Rules

### Order States
- **Active**: received, confirmed, packed, shipped, delivered
- **Archived**: Orders automatically moved to archived state 15 days after delivery

### Archiving Process
1. Order reaches "delivered" status → `deliveredAt` timestamp is saved
2. Order remains visible for 15 days
3. After 15 days → Order automatically moves to "archived" state
4. Archived orders are **READ-ONLY** (no status changes allowed)

### Data Integrity
- ✅ No data deletion - archived orders remain in database
- ✅ Stock is NOT affected during archiving
- ✅ Payment data remains intact
- ✅ All order history preserved

## Implementation

### Lazy Archiving
Orders are archived lazily when fetching order lists. The system automatically:
1. Finds all delivered orders that are 15+ days old
2. Sets `archivedAt` timestamp
3. Returns only active/archived orders based on endpoint

### API Structure

#### Customer Endpoints
- `GET /api/orders` → Returns ACTIVE orders only (non-archived)
- `GET /api/orders/archived` → Returns ARCHIVED orders only (past orders)

#### Admin Endpoints
- `GET /api/admin/orders` → Returns ACTIVE orders only (non-archived)
- `GET /api/admin/orders/archived` → Returns ARCHIVED orders only
- `PATCH /api/admin/orders/[id]` → Blocks status changes on archived orders

### Files Updated

#### Core Logic
- `src/lib/archiveOrders.ts` - Archive utility functions
  - `shouldArchiveOrder()` - Check if order should be archived
  - `archiveEligibleOrders()` - Archive all eligible orders (lazy)
  - `getActiveOrdersFilter()` - Query filter for active orders
  - `getArchivedOrdersFilter()` - Query filter for archived orders
  - `canModifyOrderStatus()` - Validation for status changes

#### API Routes
- `app/api/orders/route.ts` - Customer orders with lazy archiving
- `app/api/orders/archived/route.ts` - Customer archived orders
- `app/api/admin/orders/route.ts` - Admin orders with lazy archiving
- `app/api/admin/orders/archived/route.ts` - Admin archived orders
- `app/api/admin/orders/[id]/route.ts` - Blocks status changes on archived orders

#### Models
- `src/models/Order.ts` - Already has `deliveredAt` and `archivedAt` fields

## Usage Examples

### Check if Order Should be Archived
```typescript
import { shouldArchiveOrder } from '@/lib/archiveOrders';

const order = { deliveredAt: new Date('2026-01-01') };
if (shouldArchiveOrder(order.deliveredAt)) {
  console.log('Order is eligible for archiving');
}
```

### Archive Eligible Orders (Lazy)
```typescript
import { archiveEligibleOrders } from '@/lib/archiveOrders';

// Call before fetching orders
await archiveEligibleOrders();
```

### Fetch Active Orders
```typescript
import { getActiveOrdersFilter } from '@/lib/archiveOrders';

const activeOrders = await Order.find({
  user: userId,
  ...getActiveOrdersFilter()
});
```

### Fetch Archived Orders
```typescript
import { getArchivedOrdersFilter } from '@/lib/archiveOrders';

const archivedOrders = await Order.find({
  user: userId,
  ...getArchivedOrdersFilter()
});
```

## Verification Checklist

✅ Delivered order visible for 15 days
✅ After 15 days → automatically archived
✅ Archived orders cannot change state
✅ Active order views stay clean
✅ Customer can view past orders via `/api/orders/archived`
✅ Admin can view all archived orders via `/api/admin/orders/archived`
✅ No data deletion
✅ Stock unaffected by archiving
✅ Payment data preserved

## Testing

### Test Scenarios
1. **Normal Flow**: Create → Confirm → Pack → Ship → Deliver → Wait 15 days → Archive
2. **Archive Blocking**: Try to change status on archived order (should fail)
3. **Visibility**: Active orders should not show archived, archived endpoint should only show archived
4. **Lazy Archiving**: Fetching orders should trigger archiving of eligible orders

### Manual Testing
```bash
# 1. Create and deliver an order
# 2. Manually set deliveredAt to 16 days ago in MongoDB
db.orders.updateOne(
  { _id: ObjectId("...") },
  { $set: { deliveredAt: new Date("2025-12-31") } }
)

# 3. Fetch active orders (should trigger archiving)
curl http://localhost:3000/api/admin/orders

# 4. Verify order is archived
db.orders.findOne({ _id: ObjectId("...") })
// Should have archivedAt timestamp

# 5. Try to change status (should fail)
curl -X PATCH http://localhost:3000/api/admin/orders/... \
  -d '{"status": "packed"}'
// Should return 400 error
```

## Future Enhancements
- [ ] Add cron job for scheduled archiving (instead of lazy)
- [ ] Add UI for viewing archived orders
- [ ] Add analytics dashboard for archived orders
- [ ] Add archive export functionality
- [ ] Add configurable archive days (currently hardcoded to 15)
