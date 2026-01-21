/**
 * Centralized order status transition validation
 * Enforces strict state machine: received → confirmed → packed → shipped → delivered
 * Cancellation only allowed at received stage
 */

export type OrderStatus = 'payment_pending' | 'paid' | 'received' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled' | 'archived';

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  'payment_pending': ['paid', 'cancelled'],
  'paid': ['received', 'cancelled'],
  'received': ['confirmed', 'cancelled'],
  'confirmed': ['packed'],
  'packed': ['shipped'],
  'shipped': ['delivered'],
  'delivered': [],
  'cancelled': [],
  'archived': [],
};

/**
 * Validates if a status transition is allowed
 * @param currentStatus - Current order status
 * @param nextStatus - Desired next status
 * @returns { valid: boolean, error?: string }
 */
export function validateTransition(currentStatus: string, nextStatus: string): { valid: boolean; error?: string } {
  if (!currentStatus || !nextStatus) {
    return { valid: false, error: 'Current and next status are required' };
  }

  const allowedNextStatuses = VALID_TRANSITIONS[currentStatus as OrderStatus] || [];

  if (!allowedNextStatuses.includes(nextStatus as OrderStatus)) {
    const allowed = allowedNextStatuses.length > 0 ? allowedNextStatuses.join(', ') : 'none';
    return {
      valid: false,
      error: `Cannot transition from '${currentStatus}' to '${nextStatus}'. Allowed: ${allowed}`,
    };
  }

  return { valid: true };
}

/**
 * Gets allowed next statuses for a given status
 * @param currentStatus - Current order status
 * @returns Array of allowed next statuses
 */
export function getAllowedNextStatuses(currentStatus: string): string[] {
  return VALID_TRANSITIONS[currentStatus as OrderStatus] || [];
}

/**
 * Checks if an order can be cancelled
 * Only orders in 'received' status can be cancelled
 * @param status - Current order status
 * @returns boolean
 */
export function canCancel(status: string): boolean {
  return status === 'payment_pending' || status === 'paid' || status === 'received';
}

/**
 * Checks if an order is in a terminal state (no further transitions allowed)
 * @param status - Current order status
 * @returns boolean
 */
export function isTerminal(status: string): boolean {
  return getAllowedNextStatuses(status).length === 0;
}

/**
 * Checks if an order is delivered
 * @param status - Current order status
 * @returns boolean
 */
export function isDelivered(status: string): boolean {
  return status === 'delivered';
}
