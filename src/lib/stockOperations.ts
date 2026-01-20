/**
 * Atomic stock operations for order management
 * Ensures thread-safe stock updates using MongoDB transactions
 * 
 * STOCK CONTROL RULES:
 * 1. Stock is NEVER deducted on order creation
 * 2. Stock is deducted ONLY when admin confirms order (received → confirmed)
 * 3. Stock is restored ONLY on cancellation of confirmed orders
 * 4. All operations use atomic MongoDB operations to prevent race conditions
 */

import mongoose from 'mongoose';
import Product from '@/models/Product';

export interface StockDeductionResult {
  success: boolean;
  error?: string;
  failedProduct?: {
    id: string;
    title: string;
    requested: number;
    available: number;
  };
}

/**
 * Atomically deduct stock for multiple products in an order
 * Uses MongoDB transactions to ensure atomicity
 * Called ONLY when admin confirms an order (received → confirmed)
 * 
 * @param items - Array of { productId, quantity }
 * @param session - Optional MongoDB session (for nested transactions)
 * @returns StockDeductionResult
 */
export async function deductStockAtomically(
  items: Array<{ product: string; quantity: number }>,
  session?: mongoose.ClientSession
): Promise<StockDeductionResult> {
  const ownSession = !session;
  const activeSession = session || await mongoose.startSession();
  
  if (ownSession) {
    activeSession.startTransaction();
  }

  try {
    // First, verify all products have sufficient stock
    for (const item of items) {
      const product = await Product.findById(item.product).session(activeSession);
      
      if (!product) {
        throw new Error(`Product not found: ${item.product}`);
      }

      if (product.stock < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for ${product.title}`,
          failedProduct: {
            id: product._id.toString(),
            title: product.title,
            requested: item.quantity,
            available: product.stock,
          },
        };
      }
    }

    // All validations passed, now atomically deduct stock
    for (const item of items) {
      const product = await Product.findById(item.product).session(activeSession);
      
      if (!product) {
        throw new Error(`Product disappeared during transaction: ${item.product}`);
      }

      // Atomic stock deduction
      product.stock -= item.quantity;

      // Update out-of-stock flags
      if (product.stock <= 0) {
        product.stock = 0;
        product.isOutOfStock = true;
        product.isActive = false;
      }

      await product.save({ session: activeSession });
    }

    if (ownSession) {
      await activeSession.commitTransaction();
    }

    return { success: true };
  } catch (error) {
    if (ownSession) {
      await activeSession.abortTransaction();
    }
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during stock deduction';
    return {
      success: false,
      error: errorMessage,
    };
  } finally {
    if (ownSession) {
      activeSession.endSession();
    }
  }
}

/**
 * Atomically restore stock for multiple products
 * Called when:
 * - Admin cancels a CONFIRMED order (must restore stock)
 * - NOT called when cancelling RECEIVED orders (stock never deducted)
 * 
 * @param items - Array of { productId, quantity }
 * @param session - Optional MongoDB session (for nested transactions)
 * @returns boolean - success status
 */
export async function restoreStockAtomically(
  items: Array<{ product: string; quantity: number }>,
  session?: mongoose.ClientSession
): Promise<boolean> {
  const ownSession = !session;
  const activeSession = session || await mongoose.startSession();
  
  if (ownSession) {
    activeSession.startTransaction();
  }

  try {
    for (const item of items) {
      const product = await Product.findById(item.product).session(activeSession);
      
      if (!product) {
        console.warn(`Product not found during stock restoration: ${item.product}`);
        continue; // Skip deleted products
      }

      // Atomic stock restoration
      product.stock += item.quantity;

      // Update out-of-stock flags
      if (product.stock > 0) {
        product.isOutOfStock = false;
        product.isActive = true;
      }

      await product.save({ session: activeSession });
    }

    if (ownSession) {
      await activeSession.commitTransaction();
    }

    return true;
  } catch (error) {
    if (ownSession) {
      await activeSession.abortTransaction();
    }
    
    console.error('Error during stock restoration:', error);
    return false;
  } finally {
    if (ownSession) {
      activeSession.endSession();
    }
  }
}

/**
 * Check if order items have sufficient stock (read-only validation)
 * Used during order creation to warn customers of insufficient stock
 * Does NOT modify stock
 * 
 * @param items - Array of { productId, quantity }
 * @returns { available: boolean, error?: string, failedProduct?: object }
 */
export async function validateStockAvailability(
  items: Array<{ product: string; quantity: number }>
): Promise<{
  available: boolean;
  error?: string;
  failedProduct?: {
    id: string;
    title: string;
    requested: number;
    available: number;
  };
}> {
  try {
    for (const item of items) {
      const product = await Product.findById(item.product).lean();
      
      if (!product) {
        return {
          available: false,
          error: `Product not found: ${item.product}`,
        };
      }

      if (product.stock < item.quantity) {
        return {
          available: false,
          error: `Insufficient stock for ${product.title}`,
          failedProduct: {
            id: product._id.toString(),
            title: product.title,
            requested: item.quantity,
            available: product.stock,
          },
        };
      }
    }

    return { available: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during stock validation';
    return {
      available: false,
      error: errorMessage,
    };
  }
}
