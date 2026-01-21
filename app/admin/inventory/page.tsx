'use client';

import styles from './inventory.module.css';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface Product {
  _id: string;
  name: string;
  sku: string;
  stock: number;
  price: number;
  image?: string;
}

export default function InventoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newStock, setNewStock] = useState<number>(0);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      router.push('/login');
      return;
    }

    fetchProducts();
  }, [user, router]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/products', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      setProducts(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async (productId: string) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ stock: newStock }),
      });

      if (!response.ok) {
        throw new Error('Failed to update stock');
      }

      setEditingId(null);
      setNewStock(0);
      await fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update stock');
    }
  };

  if (loading) {
    return <div className={styles.container}><div>Loading inventory...</div></div>;
  }

  return (
    <div className={styles.container}>
      <h1>📦 Stock Management</h1>

      {error && (
        <div className={styles.errorBox}>
          {error}
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Product Name</th>
              <th>SKU</th>
              <th>Current Stock</th>
              <th>Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.noData}>
                  No products found
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product._id}>
                  <td>
                    <div className={styles.productInfo}>
                      {product.image && (
                        <img src={product.image} alt={product.name} />
                      )}
                      <span>{product.name}</span>
                    </div>
                  </td>
                  <td>{product.sku || 'N/A'}</td>
                  <td>
                    {editingId === product._id ? (
                      <input
                        type="number"
                        value={newStock}
                        onChange={(e) => setNewStock(parseInt(e.target.value))}
                        className={styles.input}
                        min="0"
                      />
                    ) : (
                      <span
                        className={
                          product.stock < 10 ? styles.lowStock : styles.normalStock
                        }
                      >
                        {product.stock}
                      </span>
                    )}
                  </td>
                  <td>${product.price.toFixed(2)}</td>
                  <td className={styles.actions}>
                    {editingId === product._id ? (
                      <>
                        <button
                          onClick={() => handleUpdateStock(product._id)}
                          className={styles.saveBtn}
                        >
                          ✓ Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setNewStock(0);
                          }}
                          className={styles.cancelBtn}
                        >
                          ✕ Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingId(product._id);
                          setNewStock(product.stock);
                        }}
                        className={styles.editBtn}
                      >
                        ✏️ Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
