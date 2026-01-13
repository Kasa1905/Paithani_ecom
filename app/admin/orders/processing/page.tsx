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

export default function OrdersProcessingPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
      // Filter orders in processing stages (confirmed, packed, shipped)
      const processingOrders = (data.orders || []).filter(
        (order: Order) =>
          order.status === 'confirmed' ||
          order.status === 'packed' ||
          order.status === 'shipped'
      );
      setOrders(processingOrders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    setError('');
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({} as { error?: string }));
        throw new Error(body.error || 'Failed to update status');
      }
      await fetchOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  const getNextStatus = (currentStatus: string): string | null => {
    switch (currentStatus) {
      case 'confirmed':
        return 'packed';
      case 'packed':
        return 'shipped';
      case 'shipped':
        return 'delivered';
      default:
        return null;
    }
  };

  if (loading) {
    return <div>Loading orders...</div>;
  }

  return (
    <div>
      <h1>Order Processing</h1>
      <nav>
        <Link href="/admin/orders">All Orders</Link> |{' '}
        <Link href="/admin/orders/received">Received</Link>
      </nav>

      {error && <p>{error}</p>}

      {orders.length === 0 ? (
        <p>No orders in processing.</p>
      ) : (
        <ul>
          {orders.map((order) => {
            const nextStatus = getNextStatus(order.status);
            return (
              <li key={order._id}>
                <div>Order ID: {order._id}</div>
                <div>User: {order.user?.email || 'N/A'}</div>
                <div>Total: ${order.totalAmount?.toFixed(2)}</div>
                <div>Status: {order.status}</div>
                <div>Created: {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}</div>
                <div>
                  {nextStatus ? (
                    <button
                      onClick={() => updateStatus(order._id, nextStatus)}
                      disabled={updatingId === order._id}
                    >
                      {updatingId === order._id
                        ? 'Updating...'
                        : `Move to ${nextStatus}`}
                    </button>
                  ) : (
                    <span>Completed</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
