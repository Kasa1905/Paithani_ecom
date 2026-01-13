'use client';

import { useEffect, useState } from 'react';

type Order = {
  _id: string;
  user: { email?: string } | null;
  totalAmount: number;
  status: string;
  createdAt?: string;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

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
        throw new Error(body.error || 'Failed to fetch admin orders');
      }
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    setSavingId(orderId);
    setError('');
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({} as { error?: string }));
        throw new Error(body.error || 'Failed to update status');
      }
      await fetchOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return <div>Loading orders...</div>;
  }

  return (
    <div>
      <h1>Admin Orders</h1>

      {error && <p>{error}</p>}

      {orders.length === 0 ? (
        <p>No orders found.</p>
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
                <label>
                  Update Status:
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order._id, e.target.value)}
                    disabled={savingId === order._id}
                  >
                    <option value="pending">pending</option>
                    <option value="shipped">shipped</option>
                    <option value="delivered">delivered</option>
                  </select>
                </label>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
