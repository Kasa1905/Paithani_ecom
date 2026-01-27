'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { UserLayout } from '@/app/shared/layouts/UserLayout';
import { useAuth } from '@/context/AuthContext';
import { pageTransition, staggerContainer, staggerItem, imageZoom, hoverLift, hoverGlow } from '@/lib/animations';

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
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortOption, setSortOption] = useState<string>('');

  useEffect(() => {
    fetchProducts(selectedCategory, sortOption, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, sortOption]);

  const fetchProducts = async (category: string, sort: string, allowCategoryUpdate = false) => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (category && category !== 'all') params.set('category', category);
      if (sort) params.set('sort', sort);
      const url = '/api/products' + (params.toString() ? `?${params.toString()}` : '');

      const res = await fetch(url, { credentials: 'include' });

      if (!res.ok) {
        const errData = await parseJsonSafe(res);
        throw new Error(errData?.error || 'Failed to fetch products');
      }

      const data = await parseJsonSafe(res);
      const incomingProducts: Product[] = data?.products || [];
      setProducts(incomingProducts);

      // Only refresh category list when pulling unfiltered results to avoid losing options
      if (allowCategoryUpdate && (!category || category === 'all')) {
        const categories = Array.from(new Set(incomingProducts.map((p) => p.category).filter(Boolean)));
        setAllCategories(categories);
      }
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
    <motion.div style={{ padding: '20px' }} {...pageTransition}>
      {/* Page Header */}
      <div style={{
        marginBottom: '32px',
        paddingBottom: '20px',
        borderBottom: '2px solid #e8e8e8'
      }}>
        <h1 style={{ 
          marginBottom: '12px',
          fontSize: '40px',
          fontWeight: 700,
          color: '#1a1a1a'
        }}>
          Our Collection
        </h1>
        <p style={{ 
          fontSize: '18px', 
          color: '#666',
          margin: 0
        }}>
          Discover authentic handcrafted Paithani sarees
        </p>
      </div>

      {/* Filters */}
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        alignItems: 'center', 
        marginBottom: '32px',
        flexWrap: 'wrap',
        padding: '20px',
        backgroundColor: '#fafafa',
        borderRadius: '12px',
        border: '1px solid #e8e8e8'
      }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 600, fontSize: '15px', color: '#1a1a1a' }}>Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ 
              padding: '10px 14px', 
              minWidth: '180px', 
              borderRadius: '8px', 
              border: '1px solid #d0d0d0',
              fontSize: '15px',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="all">All Categories</option>
            {allCategories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 600, fontSize: '15px', color: '#1a1a1a' }}>Sort By:</span>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            style={{ 
              padding: '10px 14px', 
              minWidth: '200px', 
              borderRadius: '8px', 
              border: '1px solid #d0d0d0',
              fontSize: '15px',
              backgroundColor: 'white',
              cursor: 'pointer'
            }}
          >
            <option value="">Featured</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="best_seller">Best Sellers</option>
          </select>
        </label>

        <div style={{ 
          marginLeft: 'auto',
          fontSize: '15px',
          color: '#666',
          fontWeight: 500
        }}>
          {products.length} {products.length === 1 ? 'Product' : 'Products'}
        </div>
      </div>
      
      {!isAuthenticated && (
        <motion.div 
          style={{ 
            marginBottom: '24px', 
            padding: '16px 20px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            color: '#856404'
          }} 
          {...staggerItem}
        >
          <span style={{ fontWeight: 600 }}>👉 </span>
          <Link 
            href="/login"
            style={{ 
              color: '#856404',
              textDecoration: 'underline',
              fontWeight: 600
            }}
          >
            Login
          </Link> to add items to your cart and make purchases
        </motion.div>
      )}

      {products.length === 0 ? (
        <motion.div
          style={{
            padding: '80px 40px',
            textAlign: 'center',
            backgroundColor: '#fafafa',
            borderRadius: '16px',
            border: '2px dashed #e0e0e0'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🔍</div>
          <h2 style={{ 
            fontSize: '28px', 
            color: '#666', 
            marginBottom: '12px',
            fontWeight: 600
          }}>
            No Products Found
          </h2>
          <p style={{ color: '#999', fontSize: '16px', margin: 0 }}>
            {selectedCategory !== 'all' 
              ? 'Try selecting a different category or clear your filters'
              : 'No products available at the moment. Check back soon!'}
          </p>
        </motion.div>
      ) : (
        <motion.ul 
          style={{ 
            listStyle: 'none', 
            padding: 0,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '28px'
          }}
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {products.map((product) => {
            const outOfStock = product.isOutOfStock || product.stock <= 0;
            const primaryImage = product.images && product.images.length > 0 ? product.images[0] : null;
            const isLowStock = !outOfStock && product.stock > 0 && product.stock <= 5;
            
            return (
              <motion.li 
                key={product._id} 
                variants={staggerItem}
                className="product-card"
                style={{ 
                  border: '1px solid #e8e8e8',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  opacity: outOfStock ? 0.65 : 1,
                  backgroundColor: outOfStock ? '#f9f9f9' : 'white',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  position: 'relative'
                }}
                whileHover={{
                  y: -8,
                  boxShadow: outOfStock ? '0 2px 8px rgba(0,0,0,0.06)' : '0 16px 40px rgba(0,0,0,0.12)',
                  transition: { duration: 0.28 }
                }}
              >
                <Link 
                  href={`/products/${product._id}`}
                  style={{ 
                    textDecoration: 'none', 
                    color: '#333',
                    display: 'block',
                    cursor: outOfStock ? 'default' : 'pointer'
                  }}
                >
                  {primaryImage && (
                    <div className="product-card__media" style={{
                      width: '100%',
                      height: '320px',
                      backgroundColor: '#f5f5f5',
                      overflow: 'hidden',
                      position: 'relative'
                    }}>
                      <motion.img 
                        src={primaryImage} 
                        alt={product.title}
                        className="product-card__image"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        whileHover={outOfStock ? {} : { scale: 1.06, transition: { duration: 0.32 } }}
                      />
                      
                      {/* Labels/Badges */}
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}>
                        {(product as any).isFeatured && (
                          <div style={{
                            backgroundColor: '#d4a574',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                          }}>
                            ⭐ Featured
                          </div>
                        )}
                        {(product as any).isNew && (
                          <div style={{
                            backgroundColor: '#10b981',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                          }}>
                            ✨ New
                          </div>
                        )}
                        {(product as any).isPopular && (
                          <div style={{
                            backgroundColor: '#8b5cf6',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                          }}>
                            🔥 Popular
                          </div>
                        )}
                      </div>

                      {outOfStock && (
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          color: 'white',
                          padding: '12px 24px',
                          borderRadius: '8px',
                          fontSize: '16px',
                          fontWeight: 700,
                          backdropFilter: 'blur(4px)'
                        }}>
                          OUT OF STOCK
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div style={{ padding: '20px' }}>
                    {/* Category */}
                    {product.category && (
                      <div style={{
                        fontSize: '12px',
                        color: '#999',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        fontWeight: 600,
                        marginBottom: '8px'
                      }}>
                        {product.category}
                      </div>
                    )}
                    
                    {/* Title */}
                    <h3 style={{ 
                      margin: '0 0 8px 0', 
                      fontSize: '19px', 
                      fontWeight: 600,
                      color: '#1a1a1a',
                      lineHeight: 1.3
                    }}>
                      {product.title}
                    </h3>
                    
                    {/* Description */}
                    <p style={{ 
                      margin: '0 0 16px 0', 
                      color: '#666', 
                      fontSize: '14px', 
                      lineHeight: '1.5',
                      minHeight: '42px'
                    }}>
                      {product.description.substring(0, 85)}
                      {product.description.length > 85 ? '...' : ''}
                    </p>
                    
                    {/* Price and Stock Info */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '16px',
                      paddingTop: '16px',
                      borderTop: '1px solid #e8e8e8'
                    }}>
                      <p style={{ 
                        margin: 0, 
                        fontWeight: 700, 
                        fontSize: '24px', 
                        color: '#1f2937'
                      }}>
                        ₹{product.price.toLocaleString()}
                      </p>
                      
                      {isLowStock && (
                        <div style={{
                          fontSize: '12px',
                          color: '#dc3545',
                          fontWeight: 600,
                          backgroundColor: '#fff5f5',
                          padding: '4px 10px',
                          borderRadius: '6px'
                        }}>
                          Only {product.stock} left
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.li>
            );
          })}
        </motion.ul>
      )}
    </motion.div>
    </UserLayout>
  );
}
