'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserLayout } from '@/app/shared/layouts/UserLayout';
import { useAuth } from '@/context/AuthContext';

interface Product {
  _id: string;
  title: string;
  price: number;
}

interface OrderItem {
  product: Product | string;
  quantity: number;
}

interface Order {
  _id: string;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  createdAt?: string;
  deliveredAt?: string;
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
                  <strong>Items:</strong>
                  <ul style={{ listStyle: 'none', padding: '0 0 0 12px', margin: '4px 0' }}>
                    {order.items.map((item, idx) => {
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
                  <strong>Placed on:</strong> {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}
                </div>
                {order.deliveredAt && order.status === 'delivered' && (
                  <div style={{ marginBottom: '8px', color: '#4caf50', fontWeight: 'bold' }}>
                    <strong>Delivered on:</strong> {new Date(order.deliveredAt).toLocaleString()}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </UserLayout>
  );
}
