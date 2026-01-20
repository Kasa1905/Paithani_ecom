'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Product = {
  _id: string;
  title: string;
  price: number;
  category: string;
  isActive: boolean;
  stock: number;
  isOutOfStock: boolean;
};

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const [stockEdits, setStockEdits] = useState<Record<string, number | ''>>({});
    const [deleting, setDeleting] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/products', {
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

  const handleStockChange = (id: string, value: string) => {
    const parsed = value === '' ? '' : Math.max(0, Math.floor(Number(value)));
    setStockEdits((prev) => ({ ...prev, [id]: parsed }));
  };

  const handleSaveStock = async (product: Product) => {
    const pendingValue = stockEdits[product._id];
    const nextStock = pendingValue === '' || pendingValue === undefined ? product.stock : pendingValue;

    if (!Number.isInteger(nextStock) || nextStock < 0) {
      setError('Stock must be a non-negative integer');
      return;
    }

    setSaving(product._id);
    setError('');

    try {
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productId: product._id, stock: nextStock }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update stock');
      }

      setProducts((prev) => prev.map((p) => (p._id === product._id ? data.product : p)));
      setStockEdits((prev) => ({ ...prev, [product._id]: data.product.stock }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update stock');
    } finally {
      setSaving(null);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    setDeleting(productId);
    setError('');

    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete product');
      }

      setProducts((prev) => prev.filter((p) => p._id !== productId));
      setDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product');
    } finally {
      setDeleting(null);
    }
  };

  const openDeleteConfirm = (productId: string) => {
    setDeleteConfirm(productId);
  };

  const closeDeleteConfirm = () => {
    setDeleteConfirm(null);
  };
  if (loading) {
    return <div>Loading products...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Products / Stock Management</h1>
        <button
          onClick={() => router.push('/admin/products/new')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          + Add New Product
        </button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {products.length === 0 ? (
        <p>No products found.</p>
      ) : (
        <div>
          <p>Total Products: {products.length}</p>
          <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '12px' }}>
            {products.map((product) => {
              const currentStock = stockEdits[product._id] ?? product.stock ?? 0;
              return (
                <li
                  key={product._id}
                  style={{
                    border: '1px solid #ddd',
                    padding: '12px',
                    borderRadius: '6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div>
                    <strong>{product.title}</strong> — ${product.price}
                    <div>Category: {product.category}</div>
                    <div>Status: {product.isActive ? 'Active' : 'Inactive'}</div>
                    <div>
                      Availability: {product.isOutOfStock ? 'Out of stock' : 'In stock'} (Stock: {product.stock})
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="number"
                      min={0}
                      value={currentStock}
                      onChange={(e) => handleStockChange(product._id, e.target.value)}
                      style={{ width: '90px', padding: '6px' }}
                    />
                    <button
                      onClick={() => handleSaveStock(product)}
                      disabled={saving === product._id}
                      style={{ padding: '8px 12px' }}
                    >
                      {saving === product._id ? 'Saving...' : 'Save Stock'}
                    </button>
                     <button
                       onClick={() => openDeleteConfirm(product._id)}
                       disabled={deleting === product._id}
                       style={{
                         padding: '8px 12px',
                         backgroundColor: '#dc3545',
                         color: 'white',
                         border: 'none',
                         borderRadius: '4px',
                         cursor: deleting === product._id ? 'not-allowed' : 'pointer',
                       }}
                     >
                       {deleting === product._id ? 'Deleting...' : 'Delete'}
                     </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

        {deleteConfirm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '24px',
              borderRadius: '8px',
              maxWidth: '400px',
              textAlign: 'center',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}>
              <h2 style={{ marginTop: 0 }}>Confirm Deletion</h2>
              <p>Are you sure you want to delete this product? This action cannot be undone.</p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button
                  onClick={() => handleDeleteProduct(deleteConfirm)}
                  disabled={deleting === deleteConfirm}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: deleting === deleteConfirm ? 'not-allowed' : 'pointer',
                  }}
                >
                  {deleting === deleteConfirm ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={closeDeleteConfirm}
                  disabled={deleting !== null}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: deleting !== null ? 'not-allowed' : 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
