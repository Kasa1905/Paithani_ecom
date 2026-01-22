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
        <ul style={{ 
          listStyle: 'none', 
          padding: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '20px'
        }}>
          {products.map((product) => {
            const outOfStock = product.isOutOfStock || product.stock <= 0;
            const primaryImage = product.images && product.images.length > 0 ? product.images[0] : null;
            
            return (
              <li 
                key={product._id} 
                style={{ 
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  opacity: outOfStock ? 0.6 : 1,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  backgroundColor: outOfStock ? '#f5f5f5' : 'white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
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
                  {primaryImage && (
                    <div style={{
                      width: '100%',
                      height: '250px',
                      overflow: 'hidden',
                      backgroundColor: '#f8f8f8'
                    }}>
                      <img 
                        src={primaryImage} 
                        alt={product.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                  )}
                  <div style={{ padding: '15px' }}>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>{product.title}</h3>
                    <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '14px' }}>
                      {product.description.substring(0, 80)}
                      {product.description.length > 80 ? '...' : ''}
                    </p>
                    <p style={{ margin: '8px 0 0 0', fontWeight: 'bold', fontSize: '20px', color: '#28a745' }}>
                      ₹{product.price.toFixed(2)}
                    </p>
                    {outOfStock && (
                      <p style={{ margin: '8px 0 0 0', color: '#dc3545', fontWeight: 600 }}>
                        Out of Stock
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
    </UserLayout>
  );
}
