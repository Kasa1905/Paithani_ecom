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
  imageUrl: string;
  images?: string[];
  stock: number;
  isOutOfStock: boolean;
}

const parseJsonSafe = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

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
  const [qty, setQty] = useState<number>(1);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Product not found');
        }
        const errData = await parseJsonSafe(response);
        throw new Error(errData?.error || 'Failed to fetch product');
      }

      const data = await parseJsonSafe(response);
      setProduct(data?.product || null);
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

    if (!product || product.isOutOfStock || product.stock <= 0) {
      setCartMessage('Out of stock');
      return;
    }

    // Clamp quantity to available stock
    const quantity = Math.max(1, Math.min(qty, product.stock));

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
          quantity,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please login to add items to cart');
        }
        const errorData = await parseJsonSafe(response);
        throw new Error(errorData?.error || 'Failed to add to cart');
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

    if (!product || product.isOutOfStock || product.stock <= 0) {
      setCartMessage('Out of stock');
      return;
    }

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
          quantity: Math.max(1, Math.min(qty, product.stock)),
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please login to place an order');
        }
        const errorData = await parseJsonSafe(response);
        throw new Error(errorData?.error || 'Failed to place order');
      }

      const data = await parseJsonSafe(response);
      if (!data || !data.order?._id) {
        throw new Error('Invalid order response');
      }
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

  const outOfStock = product.isOutOfStock || product.stock <= 0;

  return (
    <UserLayout>
      <div style={{ padding: '20px', maxWidth: '800px' }}>
        <Link href="/products" style={{ marginBottom: '20px', display: 'inline-block' }}>
          ← Back to Products
        </Link>

        <h1>{product.title}</h1>
        
        {product.imageUrl && (
          <div style={{ marginBottom: '20px' }}>
            <img
              src={product.imageUrl}
              alt={product.title}
              style={{
                maxWidth: '100%',
                maxHeight: '400px',
                objectFit: 'cover',
                borderRadius: '4px',
                border: '1px solid #ddd',
              }}
            />
          </div>
        )}
        
        <p style={{ fontSize: '24px', color: '#28a745', fontWeight: 'bold', margin: '20px 0' }}>
          ₹{product.price.toFixed(2)}
        </p>

        <p style={{ margin: '6px 0', fontWeight: 600, color: outOfStock ? '#dc3545' : '#28a745' }}>
          {outOfStock
            ? 'Out of stock'
            : product.stock < 5
              ? `Only ${product.stock} left`
              : 'In stock'}
        </p>

        <p style={{ color: '#666', marginBottom: '10px' }}>
          Category: {product.category}
        </p>

        <div style={{ marginBottom: '20px', lineHeight: '1.6' }}>
          <h3>Description</h3>
          <p>{product.description}</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label htmlFor="qty" style={{ color: '#333' }}>Qty</label>
            <input
              id="qty"
              type="number"
              min={1}
              max={product.stock}
              value={qty}
              onChange={(e) => {
                const val = Math.floor(Number(e.target.value) || 1);
                setQty(Math.max(1, Math.min(val, product.stock)));
              }}
              style={{ width: '70px', padding: '8px' }}
              disabled={outOfStock}
            />
          </div>
          <button
            onClick={handleAddToCart}
            disabled={addingToCart || placingOrder || outOfStock}
            style={{
              padding: '12px 24px',
              backgroundColor: outOfStock ? '#6c757d' : isAuthenticated ? '#28a745' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: addingToCart || placingOrder || outOfStock ? 'not-allowed' : 'pointer',
              fontSize: '16px',
            }}
          >
            {addingToCart ? 'Adding...' : 'Add to Cart'}
          </button>

          <button
            onClick={handleBuyNow}
            disabled={placingOrder || addingToCart || outOfStock}
            style={{
              padding: '12px 24px',
              backgroundColor: outOfStock ? '#6c757d' : isAuthenticated ? '#007bff' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: placingOrder || addingToCart || outOfStock ? 'not-allowed' : 'pointer',
              fontSize: '16px',
            }}
          >
            {placingOrder ? 'Placing Order...' : 'Buy Now'}
          </button>
        </div>

        {outOfStock && (
          <p style={{ marginTop: '8px', color: '#dc3545' }}>
            This item is currently out of stock.
          </p>
        )}

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
