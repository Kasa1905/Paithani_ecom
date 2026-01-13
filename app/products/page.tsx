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
  images: string[];
}

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
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data.products || []);
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
          {products.map((product) => (
            <li 
              key={product._id} 
              style={{ 
                marginBottom: '15px', 
                padding: '15px', 
                border: '1px solid #ddd',
                borderRadius: '4px'
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
                  ${product.price.toFixed(2)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
    </UserLayout>
  );
}
