/**
 * ORDER ARCHIVING SYSTEM - TEST UTILITIES
 * 
 * Use these utilities to test the order archiving functionality
 */

import Order from '@/models/Order';
import { shouldArchiveOrder, archiveEligibleOrders } from '@/lib/archiveOrders';

/**
 * Test utility: Simulate order delivered 16 days ago
 * Use this to test archiving without waiting 15 days
 */
export async function createTestDeliveredOrder(userId: string, daysAgo: number = 16) {
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() - daysAgo);

  const order = await Order.create({
    user: userId,
    items: [
      {
        product: '000000000000000000000000', // Placeholder - use real product ID
        quantity: 1,
      },
    ],
    totalAmount: 100,
    status: 'delivered',
    deliveredAt: deliveryDate,
    payment: {
      status: 'completed',
      amount: 100,
    },
  });

  console.log(`Created test order ${order._id} delivered ${daysAgo} days ago`);
  return order;
}

/**
 * Test utility: Check if a specific order should be archived
 */
export async function testOrderArchiving(orderId: string) {
  const order = await Order.findById(orderId);
  
  if (!order) {
    console.log('Order not found');
    return;
  }

  console.log('Order Status:', order.status);
  console.log('Delivered At:', order.deliveredAt);
  console.log('Archived At:', order.archivedAt);
  console.log('Should Archive:', shouldArchiveOrder(order.deliveredAt));

  if (shouldArchiveOrder(order.deliveredAt) && !order.archivedAt) {
    console.log('✓ Order is eligible for archiving');
  } else if (order.archivedAt) {
    console.log('✓ Order is already archived');
  } else {
    console.log('✗ Order is not yet eligible for archiving');
  }
}

/**
 * Test utility: Manually trigger archiving and report results
 */
export async function testLazyArchiving() {
  console.log('Running lazy archiving...');
  
  const archivedCount = await archiveEligibleOrders();
  
  console.log(`✓ Archived ${archivedCount} eligible orders`);
  return archivedCount;
}

/**
 * Test utility: Get archiving statistics
 */
export async function getArchivingStats() {
  const activeOrders = await Order.countDocuments({ archivedAt: null });
  const archivedOrders = await Order.countDocuments({ archivedAt: { $ne: null } });
  const deliveredOrders = await Order.countDocuments({ status: 'delivered', archivedAt: null });

  console.log('=== ARCHIVING STATISTICS ===');
  console.log(`Active Orders: ${activeOrders}`);
  console.log(`Archived Orders: ${archivedOrders}`);
  console.log(`Delivered (Not Yet Archived): ${deliveredOrders}`);

  return {
    active: activeOrders,
    archived: archivedOrders,
    deliveredNotArchived: deliveredOrders,
  };
}

// Example usage (uncomment to test):
// 
// import { testLazyArchiving, getArchivingStats } from '@/test/archiving-test';
// 
// // Test archiving
// await testLazyArchiving();
// 
// // Get stats
// await getArchivingStats();
