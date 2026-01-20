/**
 * ORDER ARCHIVING SYSTEM
 * 
 * Strict 15-day rule for delivered orders:
 * - Orders reaching "delivered" status get deliveredAt timestamp
 * - After 15 days from deliveredAt, orders are automatically archived
 * - Archived orders are read-only (no status changes allowed)
 * - No data deletion - archived orders remain in database
 * 
 * Usage:
 * - Call archiveEligibleOrders() lazily when fetching orders
 * - Call isOrderArchived() to check individual order status
 * - Call shouldArchiveOrder() to test archiving eligibility
 */

import Order from '@/models/Order';

const ARCHIVE_DAYS = 15;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Determines if an order should be archived based on deliveredAt timestamp
 * @param deliveredAt - The date when order was marked as delivered
 * @returns true if order should be archived (15+ days after delivery)
 */
export function shouldArchiveOrder(deliveredAt: Date | null | undefined): boolean {
  if (!deliveredAt) return false;
  
  const now = new Date();
  const deliveryDate = new Date(deliveredAt);
  const daysSinceDelivery = (now.getTime() - deliveryDate.getTime()) / MS_PER_DAY;
  
  return daysSinceDelivery >= ARCHIVE_DAYS;
}

/**
 * Checks if an order is already archived
 * @param order - Order document with archivedAt field
 * @returns true if order has been archived
 */
export function isOrderArchived(order: { archivedAt?: Date | null }): boolean {
  return !!order.archivedAt;
}

/**
 * LAZY ARCHIVING: Automatically archives all eligible delivered orders
 * 
 * Finds all orders that:
 * - Have status = "delivered"
 * - Have deliveredAt set
 * - Are 15+ days old
 * - Have NOT been archived yet (archivedAt is null)
 * 
 * Sets archivedAt = now for matching orders
 * 
 * @returns Number of orders archived
 */
export async function archiveEligibleOrders(): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - ARCHIVE_DAYS);

    const result = await Order.updateMany(
      {
        status: 'delivered',
        deliveredAt: { $ne: null, $lte: cutoffDate },
        archivedAt: null,
      },
      {
        $set: { archivedAt: new Date() },
      }
    );

    return result.modifiedCount || 0;
  } catch (error) {
    console.error('[ARCHIVE ERROR] Failed to archive eligible orders:', error);
    throw error;
  }
}

/**
 * Gets query filter for ACTIVE orders only
 * Excludes archived orders from results
 * 
 * @returns MongoDB query object to filter out archived orders
 */
export function getActiveOrdersFilter() {
  return { archivedAt: null };
}

/**
 * Gets query filter for ARCHIVED orders only
 * 
 * @returns MongoDB query object to get only archived orders
 */
export function getArchivedOrdersFilter() {
  return { archivedAt: { $ne: null } };
}

/**
 * Validates that an order can have its status changed
 * Archived orders are read-only and cannot be modified
 * 
 * @param order - Order to validate
 * @returns Object with valid flag and optional error message
 */
export function canModifyOrderStatus(order: { archivedAt?: Date | null }): {
  valid: boolean;
  error?: string;
} {
  if (isOrderArchived(order)) {
    return {
      valid: false,
      error: 'Cannot modify archived orders. Archived orders are read-only.',
    };
  }
  
  return { valid: true };
}
