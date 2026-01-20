'use client';

import { useEffect, useState } from 'react';

type Order = {
  _id: string;
  user: { email?: string } | null;
  items?: Array<{ product: { title: string; price: number } | string; quantity: number }>;
  totalAmount: number;
  status: string;
  createdAt?: string;
  deliveredAt?: string;
  archivedAt?: string;
};

type ViewType = 'active' | 'delivered' | 'archived';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewType>('active');

  useEffect(() => {
    fetchOrders(currentView);
  }, [currentView]);

  const fetchOrders = async (view: ViewType) => {
    setLoading(true);
    setError('');
    try {
      let url = '/api/admin/orders';
      if (view === 'delivered') {
        url = '/api/admin/orders/delivered';
      } else if (view === 'archived') {
        url = '/api/admin/orders/archived';
      }

      const res = await fetch(url, {
        credentials: 'include',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({} as { error?: string }));
        throw new Error(body.error || 'Failed to fetch orders');
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
      await fetchOrders(currentView);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setSavingId(null);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'received':
        return '#ff9800'; // Orange
      case 'confirmed':
        return '#2196f3'; // Blue
      case 'packed':
        return '#9c27b0'; // Purple
      case 'shipped':
        return '#00bcd4'; // Cyan
      case 'delivered':
        return '#4caf50'; // Green
      case 'cancelled':
        return '#f44336'; // Red
      default:
        return '#999'; // Gray
    }
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading orders...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Orders Management</h1>

      {/* Tab Navigation */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', borderBottom: '2px solid #ddd' }}>
        <button
          onClick={() => setCurrentView('active')}
          style={{
            padding: '10px 20px',
            backgroundColor: currentView === 'active' ? '#333' : '#f0f0f0',
            color: currentView === 'active' ? 'white' : '#333',
            border: 'none',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Active Orders
        </button>
        <button
          onClick={() => setCurrentView('delivered')}
          style={{
            padding: '10px 20px',
            backgroundColor: currentView === 'delivered' ? '#4caf50' : '#f0f0f0',
            color: currentView === 'delivered' ? 'white' : '#333',
            border: 'none',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Delivered (15 days)
        </button>
        <button
          onClick={() => setCurrentView('archived')}
          style={{
            padding: '10px 20px',
            backgroundColor: currentView === 'archived' ? '#999' : '#f0f0f0',
            color: currentView === 'archived' ? 'white' : '#333',
            border: 'none',
            borderRadius: '4px 4px 0 0',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Archived (Old)
        </button>
      </div>

      {error && (
        <p style={{ color: '#f44336', padding: '10px', backgroundColor: '#ffebee', borderRadius: '4px' }}>
          {error}
        </p>
      )}

      {orders.length === 0 ? (
        <p style={{ color: '#666' }}>
          {currentView === 'active' && 'No active orders.'}
          {currentView === 'delivered' && 'No delivered orders in the last 15 days.'}
          {currentView === 'archived' && 'No archived orders.'}
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {orders.map((order) => (
            <li
              key={order._id}
              style={{
                border: '1px solid #ddd',
                padding: '12px',
                marginBottom: '12px',
                borderRadius: '4px',
                borderLeft: `4px solid ${getStatusColor(order.status)}`,
              }}
            >
              <div style={{ marginBottom: '8px' }}>
                <strong>Order ID:</strong> {order._id}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>User:</strong> {order.user?.email || 'N/A'}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Items:</strong>
                <ul style={{ listStyle: 'none', padding: '0 0 0 12px', margin: '4px 0' }}>
                  {order.items && order.items.map((item, idx) => {
                    const product = typeof item.product === 'string' ? null : item.product;
                    return (
                      <li key={idx}>
                        {product ? (
                          <span>
                            {product.title} × {item.quantity} = ₹{(product.price * item.quantity).toFixed(2)}
                          </span>
                        ) : (
                          <span>Product ID: {String(item.product)} × {item.quantity}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Total:</strong> ₹{order.totalAmount?.toFixed(2)}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Status:</strong>{' '}
                <span
                  style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    backgroundColor: getStatusColor(order.status),
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                >
                  {order.status.toUpperCase()}
                </span>
              </div>
              <div style={{ marginBottom: '8px' }}>
                <strong>Created:</strong> {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
              </div>
              {order.deliveredAt && (
                <div style={{ marginBottom: '8px' }}>
                  <strong>Delivered:</strong> {new Date(order.deliveredAt).toLocaleString()}
                </div>
              )}
              {order.archivedAt && (
                <div style={{ marginBottom: '8px' }}>
                  <strong>Archived:</strong> {new Date(order.archivedAt).toLocaleString()}
                </div>
              )}

              {/* Status update - only for active orders */}
              {currentView === 'active' && (
                <div>
                  <label>
                    Update Status:
                    <select
                      value={order.status}
                      onChange={(e) => updateStatus(order._id, e.target.value)}
                      disabled={savingId === order._id || ['delivered', 'cancelled'].includes(order.status)}
                      style={{
                        marginLeft: '8px',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        cursor: savingId === order._id ? 'wait' : 'pointer',
                      }}
                    >
                      <option value={order.status} disabled>
                        {order.status.toUpperCase()} (current)
                      </option>
                      {order.status === 'received' && (
                        <>
                          <option value="confirmed">→ confirmed</option>
                          <option value="cancelled">→ cancelled (restore stock)</option>
                        </>
                      )}
                      {order.status === 'confirmed' && (
                        <option value="packed">→ packed</option>
                      )}
                      {order.status === 'packed' && (
                        <option value="shipped">→ shipped</option>
                      )}
                      {order.status === 'shipped' && (
                        <option value="delivered">→ delivered</option>
                      )}
                    </select>
                  </label>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
