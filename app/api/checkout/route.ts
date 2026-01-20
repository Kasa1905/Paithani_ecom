import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';
import Order from '@/models/Order';
import User from '@/models/User';
import { createRazorpayOrder } from '@/services/razorpay.service';

/**
 * POST /api/checkout
 * 
 * Creates a Razorpay order for an existing internal order
 * Returns Razorpay order ID and key for frontend integration
 * 
 * Request body:
 * {
 *   orderId: string (internal order ID from MongoDB)
 * }
 * 
 * Response:
 * {
 *   razorpayOrderId: string,
 *   amount: number (in paise),
 *   currency: string,
 *   keyId: string,
 *   internalOrderId: string
 * }
 */
export async function POST(req: Request) {
  try {
    await connectDB();

    // Verify authentication
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token) as { id?: string } | string;
    const userId = typeof payload === 'string' ? undefined : payload?.id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Fetch the order
    const order = await Order.findById(orderId)
      .populate({ path: 'user', model: User })
      .lean();

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify order belongs to authenticated user
    if (order.user._id.toString() !== userId) {
      return NextResponse.json(
        { error: 'Forbidden - Order does not belong to this user' },
        { status: 403 }
      );
    }

    // Only allow checkout for orders in "received" status
    if (order.status !== 'received') {
      return NextResponse.json(
        { error: `Cannot checkout order with status: ${order.status}` },
        { status: 400 }
      );
    }

    // Get user details for Razorpay
    const user = order.user as any;

    // Check if Razorpay credentials are configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.warn('[CHECKOUT] Razorpay credentials not configured - payment integration disabled');
      return NextResponse.json(
        { 
          error: 'Payment gateway not configured. Please contact administrator to set up Razorpay credentials.',
          details: 'Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env.local file'
        },
        { status: 503 } // Service Unavailable
      );
    }

    // Create Razorpay order
    const razorpayOrder = await createRazorpayOrder({
      amount: Math.round(order.totalAmount * 100), // Convert INR to paise
      orderId: orderId, // Link with internal order ID
      customerEmail: user.email,
      customerPhone: user.phone || '9999999999', // Fallback phone number
    });

    return NextResponse.json(
      {
        razorpayOrderId: razorpayOrder.razorpayOrderId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        keyId: razorpayOrder.keyId,
        internalOrderId: orderId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST /api/checkout error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create checkout' },
      { status: 500 }
    );
  }
}
