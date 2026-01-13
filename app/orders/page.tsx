'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserLayout } from '@/app/shared/layouts/UserLayout';
import { useAuth } from '@/context/AuthContext';

interface OrderItem {
  product: string;
  quantity: number;
}

interface Order {
  _id: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  createdAt?: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);
  const [message, setMessage] = useState('');

  // Enforce auth
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchOrders();
    }
  }, [authLoading, isAuthenticated]);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/orders', {
        credentials: 'include',
      });

      if (!res.ok) {
        if (res.status === 401) {
          setError('Please login to view orders');
          return;
        }
        throw new Error('Failed to fetch orders');
      }

      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const placeOrder = async () => {
    setPlacing(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Please login to place an order');
        }
        const body = await res.json().catch(() => ({} as { error?: string }));
        throw new Error(body.error || 'Failed to place order');
      }

      setMessage('Order placed successfully. Cart cleared.');
      await fetchOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (authLoading) {
    return <UserLayout><div>Loading...</div></UserLayout>;
  }

  return (
    <UserLayout>
      <div>
        <h1>Your Orders</h1>

        <button onClick={placeOrder} disabled={placing}>
          {placing ? 'Placing...' : 'Place Order'}
        </button>

        {message && <p>{message}</p>}
        {error && <p>{error}</p>}

        {loading ? (
          <p>Loading orders...</p>
        ) : orders.length === 0 ? (
          <p>No orders found.</p>
        ) : (
          <ul>
            {orders.map((order) => (
              <li key={order._id}>
                <div>Order ID: {order._id}</div>
                <div>Total: ${order.totalAmount?.toFixed(2)}</div>
                <div>Status: {order.status}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </UserLayout>
  );
}
