'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewProductPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('0');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to upload image');
      }

      const data = await res.json();
      setImageUrl(data.imageUrl);
      setMessage('Image uploaded successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Image is now optional - no validation needed

    const priceNum = parseFloat(price);
    const stockNum = parseInt(stock, 10);

    if (isNaN(priceNum) || priceNum < 0) {
      setError('Price must be a valid positive number');
      return;
    }

    if (isNaN(stockNum) || stockNum < 0) {
      setError('Stock must be a valid non-negative integer');
      return;
    }

    setCreating(true);

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title,
          description,
          price: priceNum,
          category,
          stock: stockNum,
          imageUrl,
          isActive: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create product');
      }

      setMessage('Product created successfully! Redirecting...');
      setTimeout(() => {
        router.push('/admin/products');
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Add New Product</h1>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label htmlFor="title" style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>
            Product Title *
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', fontSize: '16px' }}
          />
        </div>

        <div>
          <label htmlFor="description" style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>
            Description *
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            style={{ width: '100%', padding: '8px', fontSize: '16px' }}
          />
        </div>

        <div>
          <label htmlFor="category" style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>
            Category *
          </label>
          <input
            id="category"
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', fontSize: '16px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <label htmlFor="price" style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              Price (₹) *
            </label>
            <input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', fontSize: '16px' }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <label htmlFor="stock" style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>
              Stock *
            </label>
            <input
              id="stock"
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', fontSize: '16px' }}
            />
          </div>
        </div>

        <div>
          <label htmlFor="image" style={{ display: 'block', marginBottom: '4px', fontWeight: 600 }}>
            Product Image (optional - upload to Cloudinary)
          </label>
          <input
            id="image"
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            style={{ width: '100%', padding: '8px', fontSize: '16px' }}
          />
          {uploading && <p style={{ marginTop: '8px', color: '#007bff' }}>Uploading to Cloudinary...</p>}
        </div>

        {imageUrl && (
          <div style={{ marginTop: '12px' }}>
            <h3>Uploaded Image</h3>
            <div
              style={{
                width: '200px',
                height: '200px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                overflow: 'hidden',
                marginBottom: '12px',
              }}
            >
              <img
                src={imageUrl}
                alt="Product"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <button
              type="button"
              onClick={() => setImageUrl('')}
              style={{
                padding: '8px 12px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Change Image
            </button>
          </div>
        )}

        {error && <p style={{ color: 'red', fontWeight: 600 }}>{error}</p>}
        {message && <p style={{ color: 'green', fontWeight: 600 }}>{message}</p>}

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            type="submit"
            disabled={creating || uploading}
            style={{
              padding: '12px 24px',
              backgroundColor: creating || uploading ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: creating || uploading ? 'not-allowed' : 'pointer',
            }}
          >
            {creating ? 'Creating...' : 'Create Product'}
          </button>

          <button
            type="button"
            onClick={() => router.back()}
            disabled={creating}
            style={{
              padding: '12px 24px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              cursor: creating ? 'not-allowed' : 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
