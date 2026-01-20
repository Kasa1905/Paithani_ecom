import Order from '@/models/Order';

const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;

interface OrderLike {
  _id: any;
  status: string;
  deliveredAt?: Date;
  archivedAt?: Date;
  updatedAt?: Date;
  createdAt?: Date;
}

/**
 * Archives delivered orders older than retention window and returns non-archived orders.
 * - Delivered orders stay visible for 15 days.
 * - After 15 days they are archived (archivedAt is set) and filtered out from default results.
 */
export async function applyDeliveredOrderRetention<T extends OrderLike>(orders: T[]): Promise<T[]> {
  if (!orders.length) return orders;

  const now = Date.now();
  const cutoff = new Date(now - FIFTEEN_DAYS_MS);

  const toArchiveIds: string[] = [];
  const toBackfillDeliveredAt: { id: string; deliveredAt: Date }[] = [];
  const visible: T[] = [];

  for (const order of orders) {
    if (order.archivedAt) {
      // Already archived, skip from default view
      continue;
    }

    if (order.status === 'delivered') {
      const deliveredAt = order.deliveredAt || order.updatedAt || order.createdAt || new Date(now);

      // If deliveredAt was missing, backfill it for future checks
      if (!order.deliveredAt) {
        toBackfillDeliveredAt.push({ id: String(order._id), deliveredAt });
      }

      if (deliveredAt < cutoff) {
        toArchiveIds.push(String(order._id));
        continue; // Do not return archived orders
      }
    }

    visible.push(order);
  }

  // Persist backfilled deliveredAt timestamps
  if (toBackfillDeliveredAt.length) {
    await Promise.all(
      toBackfillDeliveredAt.map((item) =>
        Order.updateOne({ _id: item.id, deliveredAt: { $exists: false } }, { $set: { deliveredAt: item.deliveredAt } })
      )
    );
  }

  // Archive stale delivered orders
  if (toArchiveIds.length) {
    await Order.updateMany(
      { _id: { $in: toArchiveIds }, archivedAt: { $exists: false } },
      { $set: { archivedAt: new Date(now) } }
    );
  }

  return visible;
}
