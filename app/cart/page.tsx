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
    imageUrl: string;
    images: string[];
    description: string;
    stock: number;
  };
  quantity: number;
}

const parseJsonSafe = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

export default function CartPage() {
  const { isAuthenticated } = useAuth();
  const { refreshCartCount } = useCart();
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingItem, setUpdatingItem] = useState<string | null>(null);

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
        const errData = await parseJsonSafe(response);
        throw new Error(errData?.error || 'Failed to fetch cart');
      }

      const data = await parseJsonSafe(response);
      setCartItems(data?.items || []);
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

  const updateQuantity = async (productId: string, newQuantity: number, maxStock: number) => {
    if (newQuantity < 1) return;

    // Cap quantity at available stock
    const cappedQuantity = Math.min(newQuantity, maxStock);

    // If user tried to exceed stock, show friendly message
    if (newQuantity > maxStock) {
      setError(`Only ${maxStock} items available in stock`);
      setTimeout(() => setError(''), 3000);
      return;
    }

    setUpdatingItem(productId);
    setError('');
    
    try {
      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productId, quantity: cappedQuantity }),
      });

      if (!response.ok) {
        const errorData = await parseJsonSafe(response);
        throw new Error(errorData?.error || 'Failed to update quantity');
      }

      await fetchCart();
      await refreshCartCount();
    } catch (err) {
      console.error('Error updating quantity:', err);
      setError(err instanceof Error ? err.message : 'Failed to update quantity');
      setTimeout(() => setError(''), 5000);
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
        const errorData = await parseJsonSafe(response);
        throw new Error(errorData?.error || 'Failed to remove item');
      }

      await fetchCart();
      await refreshCartCount();
    } catch (err) {
      console.error('Error removing item:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove item');
      setTimeout(() => setError(''), 5000);
    } finally {
      setUpdatingItem(null);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  };

  const handleProceedToCheckout = () => {
    if (cartItems.length === 0) {
      setError('Your cart is empty');
      return;
    }
    router.push('/checkout-address');
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
          <div style={{ 
            textAlign: 'center',
            padding: '80px 40px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            marginTop: '40px',
            border: '2px dashed #e8e8e8'
          }}>
            <div style={{ fontSize: '80px', marginBottom: '24px' }}>🛒</div>
            <h2 style={{ 
              marginBottom: '16px',
              color: '#1a1a1a',
              fontSize: '32px',
              fontWeight: 600
            }}>
              Your Cart is Empty
            </h2>
            <p style={{ 
              fontSize: '16px',
              color: '#666',
              marginBottom: '32px',
              lineHeight: 1.6,
              maxWidth: '400px',
              margin: '0 auto 32px'
            }}>
              Discover beautiful handcrafted Paithani sarees and add them to your cart
            </p>
            <Link 
              href="/products"
              style={{
                display: 'inline-block',
                padding: '14px 32px',
                backgroundColor: '#d4a574',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '16px',
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(212, 165, 116, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#c19565';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#d4a574';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              Browse Our Collection
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
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                >
                  {/* Product Image */}
                  <div style={{ flexShrink: 0 }}>
                    <Link href={`/products/${item.product._id}`}>
                      <img
                        src={item.product.imageUrl || '/placeholder-product.jpg'}
                        alt={item.product.title}
                        style={{
                          width: '120px',
                          height: '120px',
                          objectFit: 'cover',
                          borderRadius: '6px',
                          border: '1px solid #e0e0e0',
                        }}
                      />
                    </Link>
                  </div>

                  {/* Product Details */}
                  <div style={{ flex: 1 }}>
                    <h3 style={{ marginBottom: '8px', fontSize: '18px' }}>
                      <Link 
                        href={`/products/${item.product._id}`}
                        style={{ color: '#007bff', textDecoration: 'none' }}
                      >
                        {item.product.title}
                      </Link>
                    </h3>
                    <p style={{ color: '#666', marginBottom: '15px', fontSize: '14px' }}>
                      {item.product.description?.substring(0, 100)}
                      {item.product.description?.length > 100 ? '...' : ''}
                    </p>
                    <p style={{ color: '#333', marginBottom: '15px', fontWeight: '500', fontSize: '16px' }}>
                      Unit Price: ₹{item.product.price.toFixed(2)}
                    </p>

                    {/* Quantity Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ marginRight: '10px', color: '#666', fontSize: '14px' }}>Quantity:</span>
                      <button
                        onClick={() => updateQuantity(item.product._id, item.quantity - 1, item.product.stock)}
                        disabled={updatingItem === item.product._id || item.quantity <= 1}
                        style={{
                          padding: '6px 14px',
                          backgroundColor: item.quantity <= 1 ? '#f0f0f0' : '#fff',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          cursor: item.quantity <= 1 ? 'not-allowed' : 'pointer',
                          fontSize: '16px',
                          fontWeight: 'bold',
                        }}
                      >
                        −
                      </button>
                      <span style={{ minWidth: '50px', textAlign: 'center', fontWeight: 'bold', fontSize: '16px' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product._id, item.quantity + 1, item.product.stock)}
                        disabled={updatingItem === item.product._id || item.quantity >= item.product.stock}
                        style={{
                          padding: '6px 14px',
                          backgroundColor: item.quantity >= item.product.stock ? '#f0f0f0' : '#fff',
                          border: '1px solid #ddd',
                          borderRadius: '4px',
                          cursor: updatingItem === item.product._id ? 'wait' : item.quantity >= item.product.stock ? 'not-allowed' : 'pointer',
                          fontSize: '16px',
                          fontWeight: 'bold',
                        }}
                      >
                        +
                      </button>
                      {item.quantity >= item.product.stock && (
                        <span style={{ marginLeft: '10px', color: '#dc3545', fontSize: '12px' }}>
                          Max stock reached
                        </span>
                      )}
                      <button
                        onClick={() => removeItem(item.product._id)}
                        disabled={updatingItem === item.product._id}
                        style={{
                          marginLeft: '20px',
                          padding: '6px 16px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: updatingItem === item.product._id ? 'wait' : 'pointer',
                          fontSize: '14px',
                        }}
                      >
                        {updatingItem === item.product._id ? 'Removing...' : 'Remove'}
                      </button>
                    </div>
                  </div>

                  {/* Item Total */}
                  <div style={{ textAlign: 'right', minWidth: '120px' }}>
                    <p style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>Item Total</p>
                    <p style={{ fontSize: '22px', fontWeight: 'bold', color: '#28a745' }}>
                      ₹{(item.product.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Summary */}
            <div
              style={{
                padding: '30px',
                border: '2px solid #28a745',
                borderRadius: '8px',
                backgroundColor: '#fff',
                marginBottom: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              <h2 style={{ marginBottom: '20px', fontSize: '24px' }}>Cart Summary</h2>
              
              <div style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #e0e0e0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '16px', color: '#666' }}>Subtotal ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})</span>
                  <span style={{ fontSize: '16px', fontWeight: '500' }}>₹{calculateTotal().toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '16px', color: '#666' }}>Shipping</span>
                  <span style={{ fontSize: '16px', fontWeight: '500', color: '#28a745' }}>FREE</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px' }}>
                <h3 style={{ fontSize: '20px' }}>Total:</h3>
                <h3 style={{ fontSize: '28px', color: '#28a745', fontWeight: 'bold' }}>₹{calculateTotal().toFixed(2)}</h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  onClick={handleProceedToCheckout}
                  style={{
                    width: '100%',
                    padding: '16px 24px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#218838')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#28a745')}
                >
                  Proceed to Checkout
                </button>
                <Link 
                  href="/products"
                  style={{
                    width: '100%',
                    padding: '14px 24px',
                    backgroundColor: 'transparent',
                    color: '#007bff',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    border: '2px solid #007bff',
                    display: 'inline-block',
                    textAlign: 'center',
                    fontSize: '16px',
                    fontWeight: '500',
                    boxSizing: 'border-box',
                  }}
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </UserLayout>
  );
}