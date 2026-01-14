'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserLayout } from '@/app/shared/layouts/UserLayout';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  images: string[];
}

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { isAuthenticated } = useAuth();
  const { refreshCartCount } = useCart();
  const router = useRouter();
  const resolvedParams = use(params);
  const productId = resolvedParams.id;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Product not found');
        }
        throw new Error('Failed to fetch product');
      }

      const data = await response.json();
      setProduct(data.product);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    setAddingToCart(true);
    setCartMessage('');

    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          productId: productId,
          quantity: 1,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please login to add items to cart');
        }
        throw new Error('Failed to add to cart');
      }

      setCartMessage('Added to cart successfully!');
      await refreshCartCount(); // Refresh cart count immediately
      setTimeout(() => setCartMessage(''), 3000);
    } catch (err) {
      setCartMessage(err instanceof Error ? err.message : 'Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!product) return;

    setPlacingOrder(true);
    setCartMessage('');

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          productId: product._id,
          quantity: 1,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please login to place an order');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to place order');
      }

      const data = await response.json();
      setCartMessage('Order placed successfully!');
      setTimeout(() => {
        router.push(`/checkout?orderId=${data.order._id}`);
      }, 1500);
    } catch (err) {
      setCartMessage(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return <UserLayout><div style={{ padding: '20px' }}>Loading product...</div></UserLayout>;
  }

  if (error || !product) {
    return (
      <UserLayout>
        <div style={{ padding: '20px' }}>
          <p style={{ color: 'red' }}>Error: {error || 'Product not found'}</p>
          <Link href="/products">Back to Products</Link>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div style={{ padding: '20px', maxWidth: '800px' }}>
        <Link href="/products" style={{ marginBottom: '20px', display: 'inline-block' }}>
          ← Back to Products
        </Link>

        <h1>{product.title}</h1>
        
        <p style={{ fontSize: '24px', color: '#28a745', fontWeight: 'bold', margin: '20px 0' }}>
          ${product.price.toFixed(2)}
        </p>

        <p style={{ color: '#666', marginBottom: '10px' }}>
          Category: {product.category}
        </p>

        <div style={{ marginBottom: '20px', lineHeight: '1.6' }}>
          <h3>Description</h3>
          <p>{product.description}</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <button
            onClick={handleAddToCart}
            disabled={addingToCart || placingOrder}
            style={{
              padding: '12px 24px',
              backgroundColor: isAuthenticated ? '#28a745' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: addingToCart || placingOrder ? 'wait' : 'pointer',
              fontSize: '16px',
            }}
          >
            {addingToCart ? 'Adding...' : 'Add to Cart'}
          </button>

          <button
            onClick={handleBuyNow}
            disabled={placingOrder || addingToCart}
            style={{
              padding: '12px 24px',
              backgroundColor: isAuthenticated ? '#007bff' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: placingOrder || addingToCart ? 'wait' : 'pointer',
              fontSize: '16px',
            }}
          >
            {placingOrder ? 'Placing Order...' : 'Buy Now'}
          </button>
        </div>

        {cartMessage && (
          <p style={{ 
            marginTop: '10px', 
            color: cartMessage.includes('success') ? '#28a745' : '#dc3545' 
          }}>
            {cartMessage}
          </p>
        )}

        {!isAuthenticated && (
          <p style={{ marginTop: '10px', color: '#666' }}>
            Please <Link href="/login">login</Link> to add items to cart
          </p>
        )}
      </div>
    </UserLayout>
  );
}
