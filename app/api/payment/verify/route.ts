import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import connectDB from '@/lib/mongodb';
import { verifyToken } from '@/lib/jwt';
import Order from '@/models/Order';
import Product from '@/models/Product';
import User from '@/models/User';
import {
  verifyPaymentSignature,
  getPaymentDetails,
} from '@/services/razorpay.service';

/**
 * POST /api/payment/verify
 * 
 * Verifies Razorpay payment and updates order status
 * 
 * Steps:
 * 1. Verify Razorpay signature (ensure payment is authentic)
 * 2. Fetch payment details from Razorpay
 * 3. Update internal order status to "confirmed"
 * 4. Return updated order
 * 
 * Request body:
 * {
 *   razorpayOrderId: string,
 *   razorpayPaymentId: string,
 *   razorpaySignature: string,
 *   internalOrderId: string
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   message: string,
 *   order: Order (with status "confirmed")
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
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      internalOrderId,
    } = body;

    // Validate required fields
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !internalOrderId) {
      return NextResponse.json(
        { error: 'Missing required payment details' },
        { status: 400 }
      );
    }

    // Step 1: Verify Razorpay signature
    const isSignatureValid = verifyPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!isSignatureValid) {
      console.warn(`Invalid signature for payment ${razorpayPaymentId}`);
      return NextResponse.json(
        { error: 'Payment verification failed - Invalid signature' },
        { status: 400 }
      );
    }

    // Step 2: Fetch payment details from Razorpay
    let paymentDetails;
    try {
      paymentDetails = await getPaymentDetails(razorpayPaymentId);
    } catch (error) {
      console.error('Failed to fetch payment details:', error);
      return NextResponse.json(
        { error: 'Failed to verify payment with Razorpay' },
        { status: 500 }
      );
    }

    // Verify payment status
    if (paymentDetails.status !== 'captured') {
      return NextResponse.json(
        { error: `Payment status is ${paymentDetails.status}, expected 'captured'` },
        { status: 400 }
      );
    }

    // Step 3: Update internal order status
    const order = await Order.findById(internalOrderId)
      .populate({ path: 'user', model: User })
      .populate({ path: 'items.product', model: Product })
      .lean();

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Verify order belongs to authenticated user
    if ((order.user as any)._id.toString() !== userId) {
      return NextResponse.json(
        { error: 'Forbidden - Order does not belong to this user' },
        { status: 403 }
      );
    }

    // Update order status to "confirmed"
    const updatedOrder = await Order.findByIdAndUpdate(
      internalOrderId,
      {
        status: 'confirmed',
        payment: {
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySignature,
          status: 'completed',
          amount: paymentDetails.amount,
          currency: paymentDetails.currency,
        },
      },
      { new: true }
    )
      .populate({ path: 'user', model: User })
      .populate({ path: 'items.product', model: Product })
      .lean();

    return NextResponse.json(
      {
        success: true,
        message: 'Payment verified and order confirmed',
        order: updatedOrder,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('POST /api/payment/verify error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to verify payment' },
      { status: 500 }
    );
  }
}
