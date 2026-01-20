'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { UserLayout } from '@/app/shared/layouts/UserLayout';

declare global {
  interface Window {
    Razorpay: any;
  }
}

type Order = {
  _id: string;
  user: { email: string; name?: string } | null;
  items: Array<{
    product: { _id: string; title: string; price: number };
    quantity: number;
  }>;
  totalAmount: number;
  status: string;
  createdAt: string;
};

// Safely parse JSON without throwing when server returns HTML/error pages
const parseJsonSafe = async (response: Response) => {
  try {
    return await response.json();
  } catch (err) {
    return null;
  }
};

function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  // Fetch order details on mount
  useEffect(() => {
    if (!orderId) {
      setError('No order ID provided');
      setLoading(false);
      return;
    }

    fetchOrder();
  }, [orderId]);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        const errData = await parseJsonSafe(response);
        throw new Error(errData?.error || 'Failed to fetch order');
      }

      const data = await parseJsonSafe(response);
      setOrder(data?.order ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!order || !orderId) return;

    setProcessing(true);
    setError('');

    try {
      // Step 1: Create Razorpay order
      const checkoutResponse = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ orderId }),
      });

      if (!checkoutResponse.ok) {
        const errData = await parseJsonSafe(checkoutResponse);
        throw new Error(errData?.error || 'Failed to create checkout');
      }

      const checkoutData = await parseJsonSafe(checkoutResponse);
      if (!checkoutData) {
        throw new Error('Invalid checkout response');
      }
      const {
        razorpayOrderId,
        keyId,
        amount,
      } = checkoutData;

      // Step 2: Open Razorpay payment modal
      const options = {
        key: keyId,
        amount: amount, // Amount in paise
        currency: 'INR',
        name: 'Paithani Sarees',
        description: `Order #${orderId}`,
        order_id: razorpayOrderId,
        handler: async (response: any) => {
          // Step 3: Verify payment on backend
          await verifyPayment(response);
        },
        prefill: {
          email: order.user?.email || '',
          contact: '9999999999',
        },
        theme: {
          color: '#28a745',
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
            setError('Payment cancelled by user');
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment initialization failed');
      setProcessing(false);
    }
  };

  const verifyPayment = async (response: any) => {
    try {
      const verifyResponse = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
          internalOrderId: orderId,
        }),
      });

      if (!verifyResponse.ok) {
        const errData = await parseJsonSafe(verifyResponse);
        throw new Error(errData?.error || 'Payment verification failed');
      }

      const verifyData = await parseJsonSafe(verifyResponse);
      if (!verifyData) {
        throw new Error('Invalid verification response');
      }

      // Payment successful
      setError('');
      setProcessing(false);

      // Redirect to orders page
      setTimeout(() => {
        router.push(`/orders?payment=success&orderId=${orderId}`);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment verification failed');
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <UserLayout>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p>Loading order details...</p>
        </div>
      </UserLayout>
    );
  }

  if (!order) {
    return (
      <UserLayout>
        <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
          <h1>Order Not Found</h1>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            {error || 'The order could not be found'}
          </p>
          <Link
            href="/orders"
            style={{
              padding: '12px 24px',
              backgroundColor: '#007bff',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '4px',
              display: 'inline-block',
            }}
          >
            Back to Orders
          </Link>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
        <h1>Checkout</h1>

        {/* Order Summary */}
        <div
          style={{
            padding: '20px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            marginBottom: '30px',
            backgroundColor: '#f9f9f9',
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: '20px' }}>Order Summary</h2>

          <div style={{ marginBottom: '15px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>Items:</h3>
            {order.items.map((item) => (
              <div
                key={item.product._id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingBottom: '10px',
                  borderBottom: '1px solid #eee',
                  marginBottom: '10px',
                }}
              >
                <span>
                  {item.product.title} x {item.quantity}
                </span>
                <span style={{ fontWeight: 'bold' }}>
                  ₹{(item.product.price * item.quantity).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '15px 0',
              borderTop: '2px solid #333',
              fontSize: '18px',
              fontWeight: 'bold',
            }}
          >
            <span>Total Amount:</span>
            <span style={{ color: '#28a745', fontSize: '24px' }}>
              ₹{order.totalAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Payment Method */}
        <div
          style={{
            padding: '20px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            marginBottom: '30px',
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: '20px' }}>Payment Method</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Secure payment powered by Razorpay
          </p>

          {error && (
            <div
              style={{
                padding: '12px',
                backgroundColor: '#fee',
                color: '#c00',
                borderRadius: '4px',
                marginBottom: '15px',
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}

          <button
            onClick={handlePayment}
            disabled={processing}
            style={{
              width: '100%',
              padding: '14px 24px',
              backgroundColor: processing ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: processing ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
            }}
          >
            {processing ? 'Processing...' : 'Pay with Razorpay'}
          </button>

          <p style={{ fontSize: '12px', color: '#999', marginTop: '10px', textAlign: 'center' }}>
            In test mode, use card number 4111111111111111 with any future date and CVV
          </p>
        </div>

        {/* Back Link */}
        <Link
          href="/orders"
          style={{
            color: '#007bff',
            textDecoration: 'none',
            fontSize: '14px',
          }}
        >
          ← Back to Orders
        </Link>
      </div>
    </UserLayout>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <UserLayout>
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p>Loading checkout...</p>
          </div>
        </UserLayout>
      }
    >
      <CheckoutClient />
    </Suspense>
  );
}
