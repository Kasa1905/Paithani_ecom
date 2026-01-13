'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Order = {
  _id: string;
  user: { email?: string } | null;
  totalAmount: number;
  status: string;
  createdAt?: string;
};

export default function OrdersReceivedPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/orders', {
        credentials: 'include',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({} as { error?: string }));
        throw new Error(body.error || 'Failed to fetch orders');
      }
      const data = await res.json();
      // Filter only pending orders
      const pendingOrders = (data.orders || []).filter(
        (order: Order) => order.status === 'pending'
      );
      setOrders(pendingOrders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const confirmOrder = async (orderId: string) => {
    setProcessingId(orderId);
    setError('');
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'confirmed' }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({} as { error?: string }));
        throw new Error(body.error || 'Failed to confirm order');
      }
      await fetchOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm order');
    } finally {
      setProcessingId(null);
    }
  };

  const rejectOrder = async (orderId: string) => {
    setProcessingId(orderId);
    setError('');
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({} as { error?: string }));
        throw new Error(body.error || 'Failed to reject order');
      }
      await fetchOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject order');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div>Loading orders...</div>;
  }

  return (
    <div>
      <h1>Orders Received (Pending)</h1>
      <nav>
        <Link href="/admin/orders">All Orders</Link> |{' '}
        <Link href="/admin/orders/processing">Processing</Link>
      </nav>

      {error && <p>{error}</p>}

      {orders.length === 0 ? (
        <p>No pending orders.</p>
      ) : (
        <ul>
          {orders.map((order) => (
            <li key={order._id}>
              <div>Order ID: {order._id}</div>
              <div>User: {order.user?.email || 'N/A'}</div>
              <div>Total: ${order.totalAmount?.toFixed(2)}</div>
              <div>Status: {order.status}</div>
              <div>Created: {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}</div>
              <div>
                <button
                  onClick={() => confirmOrder(order._id)}
                  disabled={processingId === order._id}
                >
                  {processingId === order._id ? 'Processing...' : 'Confirm (Stock Available)'}
                </button>
                {' '}
                <button
                  onClick={() => rejectOrder(order._id)}
                  disabled={processingId === order._id}
                >
                  {processingId === order._id ? 'Processing...' : 'Reject (Cancel)'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
