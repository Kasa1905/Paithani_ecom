'use client';

import { useState, useEffect } from 'react';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/products', {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading products...</div>;
  }

  return (
    <div>
      <h1>Products / Stock Management</h1>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}
      
      {products.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <div>
          <p>Total Products: {products.length}</p>
          <ul>
            {products.map((product: any) => (
              <li key={product._id}>
                <strong>{product.title}</strong> - ${product.price}
                <br />
                Status: {product.isActive ? 'Active' : 'Inactive'}
                <br />
                Category: {product.category}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
