'use client';

import { useEffect, useState } from 'react';

interface OrderItem {
  product: {
    _id: string;
    title: string;
    price: number;
  };
  quantity: number;
}

interface Order {
  _id: string;
  user: {
    _id: string;
    email: string;
  } | null;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  createdAt: string;
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/admin/orders', {
        method: 'GET',
        credentials: 'include', // 🔑 CRITICAL: Send httpOnly cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data.orders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Fetch orders error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        credentials: 'include', // 🔑 CRITICAL: Send httpOnly cookies
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order');
      }

      // Refresh orders list
      fetchOrders();
    } catch (err) {
      console.error('Update order error:', err);
      alert('Failed to update order status');
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading orders...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', color: 'red' }}>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={fetchOrders}>Retry</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Order Management</h1>
      <p style={{ marginBottom: '1rem' }}>Total orders: {orders.length}</p>
      
      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd' }}>
              <th style={{ padding: '0.5rem', textAlign: 'left' }}>Order ID</th>
              <th style={{ padding: '0.5rem', textAlign: 'left' }}>Customer</th>
              <th style={{ padding: '0.5rem', textAlign: 'left' }}>Items</th>
              <th style={{ padding: '0.5rem', textAlign: 'right' }}>Total</th>
              <th style={{ padding: '0.5rem', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '0.5rem', textAlign: 'left' }}>Date</th>
              <th style={{ padding: '0.5rem', textAlign: 'left' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '0.5rem' }}>
                  {order._id.slice(-8)}
                </td>
                <td style={{ padding: '0.5rem' }}>
                  {order.user?.email || 'N/A'}
                </td>
                <td style={{ padding: '0.5rem' }}>
                  {order.items.map((item, idx) => (
                    <div key={idx}>
                      {item.product.title} × {item.quantity}
                    </div>
                  ))}
                </td>
                <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                  ${order.totalAmount.toFixed(2)}
                </td>
                <td style={{ padding: '0.5rem' }}>
                  <select
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                    style={{ padding: '0.25rem' }}
                    aria-label="Order status"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="shipped">Shipped</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td style={{ padding: '0.5rem' }}>
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: '0.5rem' }}>
                  <button 
                    onClick={() => fetchOrders()}
                    style={{ padding: '0.25rem 0.5rem' }}
                  >
                    Refresh
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
