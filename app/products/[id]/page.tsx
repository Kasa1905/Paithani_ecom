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
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

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
      // Add to cart first
      const quantity = Math.max(1, Math.min(qty, product.stock));
      const addResponse = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          productId: product._id,
          quantity,
        }),
      });

      if (!addResponse.ok) {
        if (addResponse.status === 401) {
          throw new Error('Please login to place an order');
        }
        const errorData = await parseJsonSafe(addResponse);
        throw new Error(errorData?.error || 'Failed to add to cart');
      }

      // Go to checkout address page
      router.push('/checkout-address');
    } catch (err) {
      setCartMessage(err instanceof Error ? err.message : 'Failed to proceed to checkout');
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <UserLayout>
        <div style={{ 
          padding: '80px 20px',
          textAlign: 'center',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div style={{ 
            fontSize: '48px',
            marginBottom: '20px',
            animation: 'pulse 1.5s ease-in-out infinite'
          }}>
            ⏳
          </div>
          <p style={{ fontSize: '18px', color: '#666' }}>Loading product details...</p>
        </div>
      </UserLayout>
    );
  }

  if (error || !product) {
    return (
      <UserLayout>
        <div style={{ 
          padding: '80px 40px',
          textAlign: 'center',
          maxWidth: '600px',
          margin: '0 auto'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>❌</div>
          <h1 style={{ fontSize: '32px', color: '#dc3545', marginBottom: '16px' }}>
            Product Not Found
          </h1>
          <p style={{ color: '#666', marginBottom: '32px', fontSize: '16px' }}>
            {error || 'The product you are looking for does not exist or has been removed.'}
          </p>
          <Link 
            href="/products"
            style={{
              display: 'inline-block',
              padding: '12px 32px',
              backgroundColor: '#1f2937',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#374151'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1f2937'}
          >
            ← Browse All Products
          </Link>
        </div>
      </UserLayout>
    );
  }

  const outOfStock = product.isOutOfStock || product.stock <= 0;
  const isLowStock = !outOfStock && product.stock > 0 && product.stock <= 5;

  return (
    <UserLayout>
      <div style={{ 
        padding: '20px',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Breadcrumb */}
        <div style={{ 
          marginBottom: '32px',
          fontSize: '14px',
          color: '#666'
        }}>
          <Link 
            href="/products"
            style={{ 
              color: '#666',
              textDecoration: 'none',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#1f2937'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#666'}
          >
            ← Back to Products
          </Link>
          <span style={{ margin: '0 8px' }}>/</span>
          <span style={{ color: '#1a1a1a', fontWeight: 500 }}>{product.title}</span>
        </div>

        {/* Main Product Section */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '60px',
          marginBottom: '60px'
        }}>
          {/* Left: Images */}
          <div>
            {product.images && product.images.length > 0 ? (
              <div style={{ position: 'sticky', top: '20px' }}>
                {/* Main Image */}
                <div style={{ 
                  width: '100%',
                  height: '600px',
                  overflow: 'hidden',
                  borderRadius: '16px',
                  border: '1px solid #e8e8e8',
                  marginBottom: '16px',
                  backgroundColor: '#f5f5f5',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                }}>
                  <img
                    src={product.images[selectedImageIndex]}
                    alt={`${product.title} - Image ${selectedImageIndex + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </div>
                
                {/* Thumbnail Gallery */}
                {product.images.length > 1 && (
                  <div style={{ 
                    display: 'flex',
                    gap: '12px',
                    overflowX: 'auto',
                    paddingBottom: '8px'
                  }}>
                    {product.images.map((img, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        style={{
                          width: '100px',
                          height: '100px',
                          border: selectedImageIndex === index ? '3px solid #d4a574' : '1px solid #e8e8e8',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          padding: 0,
                          background: 'none',
                          flexShrink: 0,
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedImageIndex !== index) {
                            e.currentTarget.style.borderColor = '#d4a574';
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedImageIndex !== index) {
                            e.currentTarget.style.borderColor = '#e8e8e8';
                            e.currentTarget.style.transform = 'scale(1)';
                          }
                        }}
                      >
                        <img
                          src={img}
                          alt={`${product.title} thumbnail ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                width: '100%',
                height: '600px',
                backgroundColor: '#f5f5f5',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
                fontSize: '18px'
              }}>
                No image available
              </div>
            )}
          </div>

          {/* Right: Product Details */}
          <div>
            {/* Category */}
            <div style={{
              fontSize: '13px',
              color: '#999',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontWeight: 600,
              marginBottom: '12px'
            }}>
              {product.category || 'Paithani Saree'}
            </div>

            {/* Title */}
            <h1 style={{
              fontSize: '40px',
              fontWeight: 700,
              color: '#1a1a1a',
              marginBottom: '20px',
              lineHeight: 1.2
            }}>
              {product.title}
            </h1>

            {/* Price */}
            <div style={{ 
              fontSize: '36px', 
              color: '#1f2937', 
              fontWeight: 700, 
              marginBottom: '24px'
            }}>
              ₹{product.price.toLocaleString()}
            </div>

            {/* Stock Status */}
            <div style={{ 
              marginBottom: '32px',
              padding: '16px 20px',
              backgroundColor: outOfStock ? '#fff5f5' : isLowStock ? '#fff3cd' : '#f0fdf4',
              border: `1px solid ${outOfStock ? '#fecaca' : isLowStock ? '#ffc107' : '#86efac'}`,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ fontSize: '20px' }}>
                {outOfStock ? '❌' : isLowStock ? '⚠️' : '✅'}
              </span>
              <span style={{ 
                fontWeight: 600,
                color: outOfStock ? '#dc3545' : isLowStock ? '#856404' : '#166534',
                fontSize: '16px'
              }}>
                {outOfStock
                  ? 'Out of Stock'
                  : isLowStock
                    ? `Only ${product.stock} left in stock - Order soon!`
                    : 'In Stock - Ready to Ship'}
              </span>
            </div>

            {/* Description */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: 600, 
                marginBottom: '12px',
                color: '#1a1a1a'
              }}>
                Description
              </h3>
              <p style={{ 
                color: '#666', 
                lineHeight: 1.8,
                fontSize: '16px'
              }}>
                {product.description}
              </p>
            </div>

            {/* Quantity and Actions */}
            <div style={{ 
              marginBottom: '32px',
              padding: '24px',
              backgroundColor: '#fafafa',
              borderRadius: '12px',
              border: '1px solid #e8e8e8'
            }}>
              {/* Quantity Selector */}
              <div style={{ marginBottom: '20px' }}>
                <label 
                  htmlFor="qty" 
                  style={{ 
                    display: 'block',
                    fontWeight: 600,
                    marginBottom: '8px',
                    fontSize: '15px',
                    color: '#1a1a1a'
                  }}
                >
                  Quantity
                </label>
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
                  style={{ 
                    width: '120px',
                    padding: '12px 16px',
                    fontSize: '16px',
                    fontWeight: 600,
                    borderRadius: '8px',
                    border: '1px solid #d0d0d0',
                    backgroundColor: 'white'
                  }}
                  disabled={outOfStock}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart || placingOrder || outOfStock || !isAuthenticated}
                  style={{
                    padding: '16px 32px',
                    backgroundColor: outOfStock || !isAuthenticated ? '#9ca3af' : '#1f2937',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: addingToCart || placingOrder || outOfStock || !isAuthenticated ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                  onMouseEnter={(e) => {
                    if (!addingToCart && !placingOrder && !outOfStock && isAuthenticated) {
                      e.currentTarget.style.backgroundColor = '#374151';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#1f2937';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {addingToCart ? '⏳ Adding to Cart...' : '🛒 Add to Cart'}
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={placingOrder || addingToCart || outOfStock || !isAuthenticated}
                  style={{
                    padding: '16px 32px',
                    backgroundColor: outOfStock || !isAuthenticated ? '#9ca3af' : '#d4a574',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: placingOrder || addingToCart || outOfStock || !isAuthenticated ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    fontWeight: 600,
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 8px rgba(212, 165, 116, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    if (!placingOrder && !addingToCart && !outOfStock && isAuthenticated) {
                      e.currentTarget.style.backgroundColor = '#c19565';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#d4a574';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {placingOrder ? '⏳ Processing...' : '⚡ Buy Now'}
                </button>
              </div>

              {!isAuthenticated && (
                <p style={{ 
                  marginTop: '16px',
                  padding: '12px',
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffc107',
                  borderRadius: '6px',
                  color: '#856404',
                  fontSize: '14px',
                  textAlign: 'center'
                }}>
                  Please <Link href="/login" style={{ color: '#856404', fontWeight: 600 }}>login</Link> to add items to cart
                </p>
              )}

              {cartMessage && (
                <p style={{ 
                  marginTop: '16px',
                  padding: '12px',
                  backgroundColor: cartMessage.includes('success') ? '#f0fdf4' : '#fff5f5',
                  border: `1px solid ${cartMessage.includes('success') ? '#86efac' : '#fecaca'}`,
                  borderRadius: '6px',
                  color: cartMessage.includes('success') ? '#166534' : '#dc2626',
                  fontSize: '14px',
                  fontWeight: 500,
                  textAlign: 'center'
                }}>
                  {cartMessage}
                </p>
              )}
            </div>

            {/* Trust Badges */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              padding: '20px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e8e8e8'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>🛡️</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: '#1a1a1a' }}>
                    Quality Guaranteed
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    Authentic silk
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>🚚</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: '#1a1a1a' }}>
                    Free Shipping
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    On all orders
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>↩️</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: '#1a1a1a' }}>
                    Easy Returns
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    7-day policy
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>🔒</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: '#1a1a1a' }}>
                    Secure Payment
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    100% protected
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information Sections */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '32px',
          marginBottom: '60px'
        }}>
          {/* Fabric Details */}
          <div style={{
            padding: '32px',
            backgroundColor: '#fafafa',
            borderRadius: '16px',
            border: '1px solid #e8e8e8'
          }}>
            <h3 style={{ 
              fontSize: '22px', 
              fontWeight: 600, 
              marginBottom: '20px',
              color: '#1a1a1a',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span>✨</span> Fabric Details
            </h3>
            <div style={{ color: '#666', lineHeight: 1.8, fontSize: '15px' }}>
              <p style={{ marginBottom: '12px' }}>
                <strong>Material:</strong> Pure Silk
              </p>
              <p style={{ marginBottom: '12px' }}>
                <strong>Weave:</strong> Traditional Paithani handloom
              </p>
              <p style={{ marginBottom: '12px' }}>
                <strong>Zari:</strong> Authentic gold/silver thread
              </p>
              <p style={{ margin: 0 }}>
                <strong>Care:</strong> Dry clean only
              </p>
            </div>
          </div>

          {/* Delivery Info */}
          <div style={{
            padding: '32px',
            backgroundColor: '#fafafa',
            borderRadius: '16px',
            border: '1px solid #e8e8e8'
          }}>
            <h3 style={{ 
              fontSize: '22px', 
              fontWeight: 600, 
              marginBottom: '20px',
              color: '#1a1a1a',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span>📦</span> Delivery & Returns
            </h3>
            <div style={{ color: '#666', lineHeight: 1.8, fontSize: '15px' }}>
              <p style={{ marginBottom: '12px' }}>
                <strong>Delivery:</strong> 5-7 business days
              </p>
              <p style={{ marginBottom: '12px' }}>
                <strong>Returns:</strong> 7 days from delivery
              </p>
              <p style={{ marginBottom: '12px' }}>
                <strong>Exchange:</strong> Available for size/color
              </p>
              <p style={{ margin: 0 }}>
                <strong>Packaging:</strong> Premium gift box included
              </p>
            </div>
          </div>
        </div>

        {/* Care Instructions */}
        <div style={{
          padding: '40px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e8e8e8',
          marginBottom: '40px'
        }}>
          <h3 style={{ 
            fontSize: '26px', 
            fontWeight: 600, 
            marginBottom: '24px',
            color: '#1a1a1a',
            textAlign: 'center'
          }}>
            Care Instructions
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px'
          }}>
            {[
              { icon: '🧼', text: 'Dry clean only - Do not wash at home' },
              { icon: '☀️', text: 'Avoid direct sunlight for storage' },
              { icon: '🏠', text: 'Store in cool, dry place' },
              { icon: '👔', text: 'Iron on reverse with low heat' }
            ].map((item, index) => (
              <div 
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '20px',
                  backgroundColor: '#fafafa',
                  borderRadius: '12px'
                }}
              >
                <span style={{ fontSize: '32px' }}>{item.icon}</span>
                <span style={{ color: '#666', fontSize: '15px', lineHeight: 1.5 }}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
