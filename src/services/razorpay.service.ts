import crypto from 'crypto';

/**
 * Razorpay Service - Handles all Razorpay payment operations
 * Provides methods for creating orders and verifying payments
 */

interface CreateOrderParams {
  amount: number; // Amount in paise (1 INR = 100 paise)
  orderId: string; // Internal order ID to link with Razorpay order
  customerEmail: string;
  customerPhone: string;
}

interface VerifyPaymentParams {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

/**
 * Create a Razorpay order
 * @param params - Order creation parameters
 * @returns Razorpay order object with order ID and key
 */
export async function createRazorpayOrder(params: CreateOrderParams) {
  const { amount, orderId, customerEmail, customerPhone } = params;

  const key = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key || !secret) {
    throw new Error('Razorpay credentials not configured');
  }

  try {
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}`,
      },
      body: JSON.stringify({
        amount, // Amount in paise
        currency: 'INR',
        receipt: orderId, // Link internal order ID as receipt
        notes: {
          orderId, // Custom note to store internal order ID
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Razorpay API error: ${error.error?.description || 'Unknown error'}`);
    }

    const order = await response.json();

    return {
      razorpayOrderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: key,
    };
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
}

/**
 * Verify payment signature from Razorpay
 * Uses HMAC-SHA256 to verify authenticity
 * @param params - Payment verification parameters
 * @returns true if signature is valid, false otherwise
 */
export function verifyPaymentSignature(params: VerifyPaymentParams): boolean {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = params;
  const secret = process.env.RAZORPAY_KEY_SECRET;

  if (!secret) {
    console.error('Razorpay secret not configured');
    return false;
  }

  try {
    // Create HMAC-SHA256 hash
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    // Compare signatures using constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(razorpaySignature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Error verifying payment signature:', error);
    return false;
  }
}

/**
 * Fetch payment details from Razorpay
 * @param paymentId - Razorpay payment ID
 * @returns Payment object with details
 */
export async function getPaymentDetails(paymentId: string) {
  const key = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key || !secret) {
    throw new Error('Razorpay credentials not configured');
  }

  try {
    const response = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch payment details');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching payment details:', error);
    throw error;
  }
}

/**
 * Fetch order details from Razorpay
 * @param orderId - Razorpay order ID
 * @returns Order object with payment details
 */
export async function getOrderDetails(orderId: string) {
  const key = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key || !secret) {
    throw new Error('Razorpay credentials not configured');
  }

  try {
    const response = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch order details');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching order details:', error);
    throw error;
  }
}
