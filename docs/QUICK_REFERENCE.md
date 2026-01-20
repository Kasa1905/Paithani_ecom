# Quick Reference - Order Lifecycle

## Status Flow
```
received ──→ confirmed ──→ packed ──→ shipped ──→ delivered
    ↓
cancelled (stock restored)
```

## Admin URLs
- `/admin/orders` - Tab-based order management
  - Active Orders (default)
  - Delivered (15 days retention)
  - Archived (auto-moved after 15 days)

## API Endpoints
```
GET  /api/admin/orders              # Active orders
GET  /api/admin/orders/delivered    # Delivered (< 15 days)
GET  /api/admin/orders/archived     # Archived (≥ 15 days)
PATCH /api/admin/orders/:id         # Update status
GET  /api/orders                    # Customer orders
```

## Transition Rules
| From | To | Allowed |
|------|----|---------| 
| received | confirmed, cancelled | ✅ |
| confirmed | packed | ✅ |
| packed | shipped | ✅ |
| shipped | delivered | ✅ |
| delivered | - | ❌ |
| cancelled | - | ❌ |

## Key Events
1. **Order Created** → Status: `received`, `createdAt` set
2. **Order Confirmed** → Status: `confirmed`
3. **Order Packed** → Status: `packed`
4. **Order Shipped** → Status: `shipped`
5. **Order Delivered** → Status: `delivered`, `deliveredAt` set
6. **After 15 Days** → `archivedAt` set, moved to archive

## Color Coding
- 🟠 Orange: received
- 🔵 Blue: confirmed
- 🟣 Purple: packed
- 🔷 Cyan: shipped
- 🟢 Green: delivered
- ⚫ Gray: archived

## Customer View
- `/orders` - Read-only order history
- Shows delivery timestamp for completed orders
- Displays status with color coding
- No action buttons

## Data Safety
✅ All orders preserved forever
✅ Stock restored on cancellation
✅ Timestamps: createdAt, deliveredAt, archivedAt
✅ No hard deletes

## Error Messages
```
"Cannot transition from 'X' to 'Y'. Allowed: [list]"
"Cannot update archived orders"
```

## Testing Quick Check
```bash
# Valid transition
received → confirmed ✅

# Invalid transition
received → packed ❌ (skips steps)

# Cancellation
received → cancelled ✅ (restores stock)
confirmed → cancelled ❌

# Archival
delivered (after 15 days) → archived ✅
```
