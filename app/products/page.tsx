'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { UserLayout } from '@/app/shared/layouts/UserLayout';
import { useAuth } from '@/context/AuthContext';

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

export default function ProductsPage() {
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products', {
        credentials: 'include',
      });

      if (!response.ok) {
        const errData = await parseJsonSafe(response);
        throw new Error(errData?.error || 'Failed to fetch products');
      }

      const data = await parseJsonSafe(response);
      setProducts(data?.products || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <UserLayout><div style={{ padding: '20px' }}>Loading products...</div></UserLayout>;
  }

  if (error) {
    return (
      <UserLayout>
      <div style={{ padding: '20px', color: 'red' }}>
        <p>Error: {error}</p>
      </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
    <div style={{ padding: '20px' }}>
      <h1>Products</h1>
      
      {!isAuthenticated && (
        <p style={{ marginBottom: '20px', color: '#666' }}>
          <Link href="/login">Login</Link> to add items to your cart
        </p>
      )}

      {products.length === 0 ? (
        <p>No products available</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {products.map((product) => {
            const outOfStock = product.isOutOfStock || product.stock <= 0;
            return (
              <li 
                key={product._id} 
                style={{ 
                  marginBottom: '15px', 
                  padding: '15px', 
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  opacity: outOfStock ? 0.5 : 1,
                  pointerEvents: outOfStock ? 'none' : 'auto',
                  backgroundColor: outOfStock ? '#f5f5f5' : 'transparent',
                }}
              >
                <Link 
                  href={`/products/${product._id}`}
                  style={{ 
                    textDecoration: 'none', 
                    color: '#333',
                    display: 'block'
                  }}
                >
                  <h3 style={{ margin: '0 0 10px 0' }}>{product.title}</h3>
                  <p style={{ margin: '0 0 10px 0', color: '#666' }}>
                    {product.description.substring(0, 100)}
                    {product.description.length > 100 ? '...' : ''}
                  </p>
                  <p style={{ margin: 0, fontWeight: 'bold', color: '#28a745' }}>
                    ₹{product.price.toFixed(2)}
                  </p>
                </Link>
                {outOfStock && (
                  <p style={{ margin: '10px 0 0 0', color: '#dc3545', fontWeight: 600 }}>
                    Out of Stock
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
    </UserLayout>
  );
}
