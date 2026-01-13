'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserLayout } from '@/app/shared/layouts/UserLayout';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

interface CartItem {
  product: {
    _id: string;
    title: string;
    price: number;
    images: string[];
    description: string;
  };
  quantity: number;
}

export default function CartPage() {
  const { isAuthenticated } = useAuth();
  const { refreshCartCount } = useCart();
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingItem, setUpdatingItem] = useState<string | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);

  const fetchCart = async () => {
    try {
      const response = await fetch('/api/cart', {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch cart');
      }

      const data = await response.json();
      setCartItems(data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    fetchCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const updateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    setUpdatingItem(productId);
    try {
      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productId, quantity: newQuantity }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update quantity');
      }

      await fetchCart();
      await refreshCartCount();
    } catch (err) {
      console.error('Error updating quantity:', err);
      alert(err instanceof Error ? err.message : 'Failed to update quantity');
    } finally {
      setUpdatingItem(null);
    }
  };

  const removeItem = async (productId: string) => {
    setUpdatingItem(productId);
    try {
      const response = await fetch('/api/cart', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove item');
      }

      await fetchCart();
      await refreshCartCount();
    } catch (err) {
      console.error('Error removing item:', err);
      alert(err instanceof Error ? err.message : 'Failed to remove item');
    } finally {
      setUpdatingItem(null);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  };

  const handlePlaceOrder = async () => {
    if (cartItems.length === 0) {
      alert('Your cart is empty');
      return;
    }

    setPlacingOrder(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          items: cartItems.map(item => ({
            product: item.product._id,
            quantity: item.quantity,
            price: item.product.price,
          })),
          totalAmount: calculateTotal(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to place order');
      }

      await refreshCartCount();
      alert('Order placed successfully!');
      router.push('/orders');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return <UserLayout><div style={{ padding: '20px' }}>Loading cart...</div></UserLayout>;
  }

  if (error) {
    return (
      <UserLayout>
        <div style={{ padding: '20px' }}>
          <p style={{ color: 'red' }}>Error: {error}</p>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1>Shopping Cart</h1>

        {cartItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ fontSize: '18px', color: '#666', marginBottom: '20px' }}>
              Your cart is empty
            </p>
            <Link 
              href="/products"
              style={{
                padding: '12px 24px',
                backgroundColor: '#007bff',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '4px',
                display: 'inline-block',
              }}
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '30px' }}>
              {cartItems.map((item) => (
                <div
                  key={item.product._id}
                  style={{
                    display: 'flex',
                    gap: '20px',
                    padding: '20px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    marginBottom: '15px',
                    backgroundColor: '#fff',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h3 style={{ marginBottom: '10px' }}>
                      <Link 
                        href={`/products/${item.product._id}`}
                        style={{ color: '#007bff', textDecoration: 'none' }}
                      >
                        {item.product.title}
                      </Link>
                    </h3>
                    <p style={{ color: '#666', marginBottom: '10px' }}>
                      Price: ${item.product.price.toFixed(2)}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                        disabled={updatingItem === item.product._id || item.quantity <= 1}
                        style={{
                          padding: '5px 12px',
                          backgroundColor: '#f8f9fa',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        -
                      </button>
                      <span style={{ minWidth: '40px', textAlign: 'center', fontWeight: 'bold' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                        disabled={updatingItem === item.product._id}
                        style={{
                          padding: '5px 12px',
                          backgroundColor: '#f8f9fa',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeItem(item.product._id)}
                        disabled={updatingItem === item.product._id}
                        style={{
                          marginLeft: '20px',
                          padding: '5px 12px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#28a745' }}>
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                padding: '20px',
                border: '2px solid #28a745',
                borderRadius: '8px',
                backgroundColor: '#f8f9fa',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2>Total:</h2>
                <h2 style={{ color: '#28a745' }}>${calculateTotal().toFixed(2)}</h2>
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <Link 
                  href="/products"
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '4px',
                    display: 'inline-block',
                    textAlign: 'center',
                  }}
                >
                  Continue Shopping
                </Link>
                <button
                  onClick={handlePlaceOrder}
                  disabled={placingOrder}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: placingOrder ? 'wait' : 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                  }}
                >
                  {placingOrder ? 'Placing Order...' : 'Place Order'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </UserLayout>
  );
}