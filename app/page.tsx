'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { UserLayout } from '@/app/shared/layouts/UserLayout';
import { useAuth } from '@/context/AuthContext';
import { pageTransition, staggerContainer, staggerItem, cardReveal, easeOutCubic } from '@/lib/animations';

interface Product {
  _id: string;
  title: string;
  images: string[];
  price: number;
  category: string;
  isFeatured?: boolean;
}

interface SiteSettings {
  bannerImageUrl: string;
  isBannerVisible: boolean;
}

export default function Page() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data.settings);
      }
    } catch (err) {
      console.error('Failed to fetch site settings:', err);
    }
  };

  const fetchFeaturedProducts = async () => {
    try {
      const res = await fetch('/api/products', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        const featured = data.products.filter((p: any) => p.isFeatured && p.isActive && p.images && p.images.length > 0);
        const all = data.products.filter((p: any) => p.isActive);
        setFeaturedProducts(featured);
        setAllProducts(all);
        if (featured.length === 0) {
          console.log('No featured products found. Add products and mark them as featured in admin panel.');
        }
      }
    } catch (err) {
      console.error('Failed to fetch featured products:', err);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchFeaturedProducts();
  }, []);

  useEffect(() => {
    // Auto-advance slideshow every 4 seconds
    if (featuredProducts.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % featuredProducts.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [featuredProducts]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <UserLayout>
      <motion.div {...pageTransition}>
        
        {/* Hero Section with Featured Slideshow */}
        <section style={{
          marginBottom: '60px',
          background: 'linear-gradient(to bottom, #fafafa, #ffffff)',
          padding: '40px 20px',
          marginLeft: '-20px',
          marginRight: '-20px',
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <motion.div 
              style={{ textAlign: 'center', marginBottom: '32px' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <h1 style={{ 
                fontSize: '48px', 
                fontWeight: 700, 
                margin: '0 0 16px 0',
                color: '#1a1a1a',
                letterSpacing: '-0.02em'
              }}>
                Premium Paithani Silk Collection
              </h1>
              <p style={{ 
                fontSize: '20px', 
                color: '#666',
                maxWidth: '600px',
                margin: '0 auto',
                lineHeight: 1.6
              }}>
                Experience the timeless elegance of authentic handcrafted Paithani sarees
              </p>
            </motion.div>

            {/* Featured Products Slideshow */}
            {featuredProducts.length > 0 ? (
              <motion.div 
                style={{ margin: '0 auto' }}
                variants={staggerContainer} 
                initial="initial" 
                animate="animate"
              >
                <div style={{ position: 'relative', maxWidth: '900px', margin: '0 auto' }}>
                  <div style={{ 
                    position: 'relative',
                    width: '100%',
                    height: '500px',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
                    backgroundColor: '#f5f5f5'
                  }}>
                    <AnimatePresence mode="wait">
                      <motion.button
                        key={featuredProducts[currentSlide]._id}
                        onClick={() => router.push(`/products/${featuredProducts[currentSlide]._id}`)}
                        style={{
                          width: '100%',
                          height: '100%',
                          padding: 0,
                          border: 'none',
                          cursor: 'pointer',
                          background: 'none',
                          pointerEvents: 'auto',
                          zIndex: 10,
                          position: 'absolute',
                          top: 0,
                          left: 0,
                        }}
                        aria-label={`View ${featuredProducts[currentSlide].title}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                      >
                        <motion.img
                          src={featuredProducts[currentSlide].images[0]}
                          alt={featuredProducts[currentSlide].title}
                          className="hero-slide-image"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          initial={{ scale: 0.98 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.5, ease: easeOutCubic }}
                        />
                      </motion.button>
                    </AnimatePresence>

                    {/* Featured Badge */}
                    <div style={{
                      position: 'absolute',
                      top: '20px',
                      left: '20px',
                      backgroundColor: '#d4a574',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 600,
                      zIndex: 20
                    }}>
                      ✨ Featured
                    </div>

                    <motion.div style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      color: 'white',
                      padding: '24px',
                      backdropFilter: 'blur(8px)',
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.36, delay: 0.1 }}
                    >
                      <h2 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: 600 }}>
                        {featuredProducts[currentSlide].title}
                      </h2>
                      <p style={{ margin: 0, fontSize: '18px', opacity: 0.9 }}>
                        ₹{featuredProducts[currentSlide].price?.toLocaleString()}
                      </p>
                    </motion.div>
                  </div>

                  {/* Navigation Dots */}
                  {featuredProducts.length > 1 && (
                    <motion.div style={{ 
                      marginTop: '24px', 
                      textAlign: 'center', 
                      display: 'flex', 
                      justifyContent: 'center', 
                      gap: '8px', 
                      flexWrap: 'wrap' 
                    }}>
                      {featuredProducts.map((_, index) => (
                        <motion.button
                          key={index}
                          onClick={() => setCurrentSlide(index)}
                          style={{
                            padding: '6px 16px',
                            background: index === currentSlide ? '#1f2937' : '#e5e5e5',
                            color: index === currentSlide ? '#ffffff' : '#666',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '14px',
                          }}
                          aria-label={`View ${featuredProducts[index].title}`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                        >
                          {index + 1}
                        </motion.button>
                      ))}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                style={{
                  maxWidth: '900px',
                  margin: '0 auto',
                  padding: '60px 40px',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '16px',
                  border: '2px dashed #e0e0e0',
                  textAlign: 'center'
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <h3 style={{ fontSize: '24px', color: '#666', margin: '0 0 12px 0' }}>
                  No Featured Products Yet
                </h3>
                <p style={{ color: '#999', margin: 0 }}>
                  Mark products as featured in the admin panel to showcase them here
                </p>
              </motion.div>
            )}
          </div>
        </section>

        {/* Why Choose Us Section */}
        <section style={{ marginBottom: '60px' }}>
          <motion.h2 
            style={{ 
              textAlign: 'center', 
              fontSize: '36px', 
              marginBottom: '40px',
              color: '#1a1a1a'
            }}
            variants={cardReveal}
            initial="initial"
            animate="animate"
          >
            Why Choose Our Paithani Collection
          </motion.h2>
          
          <motion.div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
            }}
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {[
              {
                icon: '🎨',
                title: 'Authentic Craftsmanship',
                description: 'Each Paithani is handwoven by skilled artisans using traditional techniques passed down through generations'
              },
              {
                icon: '✨',
                title: 'Premium Silk Quality',
                description: 'Made from the finest silk threads with genuine zari work for lasting brilliance and comfort'
              },
              {
                icon: '🛡️',
                title: 'Quality Guaranteed',
                description: 'Every piece is carefully inspected and comes with authenticity certification'
              },
              {
                icon: '🚚',
                title: 'Secure Delivery',
                description: 'Safe packaging and reliable shipping to ensure your saree reaches you in perfect condition'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                style={{
                  padding: '32px',
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e8e8e8',
                  textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
                variants={staggerItem}
                whileHover={{
                  y: -4,
                  boxShadow: '0 12px 32px rgba(0,0,0,0.08)',
                  transition: { duration: 0.2 }
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                  {feature.icon}
                </div>
                <h3 style={{ 
                  fontSize: '20px', 
                  fontWeight: 600, 
                  marginBottom: '12px',
                  color: '#1a1a1a'
                }}>
                  {feature.title}
                </h3>
                <p style={{ 
                  color: '#666', 
                  lineHeight: 1.6,
                  margin: 0,
                  fontSize: '15px'
                }}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Product Categories */}
        <section style={{ marginBottom: '60px' }}>
          <motion.h2 
            style={{ 
              textAlign: 'center', 
              fontSize: '36px', 
              marginBottom: '40px',
              color: '#1a1a1a'
            }}
            variants={cardReveal}
            initial="initial"
            animate="animate"
          >
            Shop by Category
          </motion.h2>
          
          <motion.div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '20px',
            }}
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {['Traditional', 'Contemporary', 'Bridal', 'Designer'].map((category, index) => (
              <motion.div
                key={index}
                variants={staggerItem}
              >
                <Link
                  href={`/products?category=${category}`}
                  style={{
                    display: 'block',
                    padding: '40px 24px',
                    backgroundColor: '#fafafa',
                    borderRadius: '12px',
                    border: '1px solid #e8e8e8',
                    textAlign: 'center',
                    textDecoration: 'none',
                    color: '#1a1a1a',
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f0f0f0';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#fafafa';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <h3 style={{ 
                    fontSize: '24px', 
                    fontWeight: 600,
                    margin: 0
                  }}>
                    {category}
                  </h3>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* Best Sellers / Latest Products */}
        {allProducts.length > 0 && (
          <section style={{ marginBottom: '60px' }}>
            <motion.div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '32px',
                flexWrap: 'wrap',
                gap: '16px'
              }}
              variants={cardReveal}
              initial="initial"
              animate="animate"
            >
              <h2 style={{ 
                fontSize: '36px', 
                margin: 0,
                color: '#1a1a1a'
              }}>
                Discover Our Collection
              </h2>
              <Link
                href="/products"
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#1f2937',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                  display: 'inline-block'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#374151';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#1f2937';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                View All Products →
              </Link>
            </motion.div>

            <motion.div 
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '24px',
              }}
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {allProducts.slice(0, 8).map((product) => (
                <motion.div
                  key={product._id}
                  variants={staggerItem}
                  whileHover={{
                    y: -6,
                    boxShadow: '0 16px 40px rgba(0,0,0,0.12)',
                    transition: { duration: 0.2 }
                  }}
                >
                  <Link
                    href={`/products/${product._id}`}
                    style={{
                      display: 'block',
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      border: '1px solid #e8e8e8',
                      overflow: 'hidden',
                      textDecoration: 'none',
                      color: '#333',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    }}
                  >
                    {product.images && product.images.length > 0 && (
                      <div style={{
                        width: '100%',
                        height: '300px',
                        backgroundColor: '#f5f5f5',
                        overflow: 'hidden',
                        position: 'relative'
                      }}>
                        <img 
                          src={product.images[0]} 
                          alt={product.title}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.3s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                          }}
                        />
                        {product.isFeatured && (
                          <div style={{
                            position: 'absolute',
                            top: '12px',
                            right: '12px',
                            backgroundColor: '#d4a574',
                            color: 'white',
                            padding: '4px 12px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600
                          }}>
                            Featured
                          </div>
                        )}
                      </div>
                    )}
                    <div style={{ padding: '20px' }}>
                      <h3 style={{ 
                        margin: '0 0 8px 0', 
                        fontSize: '18px', 
                        fontWeight: 600,
                        color: '#1a1a1a'
                      }}>
                        {product.title}
                      </h3>
                      {product.category && (
                        <p style={{
                          margin: '0 0 12px 0',
                          fontSize: '14px',
                          color: '#999',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          {product.category}
                        </p>
                      )}
                      <p style={{ 
                        margin: 0, 
                        fontSize: '20px', 
                        fontWeight: 600,
                        color: '#1f2937'
                      }}>
                        ₹{product.price?.toLocaleString()}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </section>
        )}

        {/* Trust & Testimonials Section */}
        <section style={{
          marginBottom: '60px',
          padding: '60px 40px',
          backgroundColor: '#fafafa',
          borderRadius: '16px',
          marginLeft: '-20px',
          marginRight: '-20px',
        }}>
          <motion.div
            style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}
            variants={cardReveal}
            initial="initial"
            animate="animate"
          >
            <h2 style={{ 
              fontSize: '36px', 
              marginBottom: '20px',
              color: '#1a1a1a'
            }}>
              Trusted by Thousands
            </h2>
            <p style={{ 
              fontSize: '18px', 
              color: '#666',
              marginBottom: '40px',
              lineHeight: 1.6
            }}>
              Join our community of satisfied customers who have experienced the beauty and quality of authentic Paithani silk
            </p>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '32px',
              marginTop: '40px'
            }}>
              {[
                { number: '10,000+', label: 'Happy Customers' },
                { number: '500+', label: 'Sarees Delivered' },
                { number: '50+', label: 'Unique Designs' },
                { number: '100%', label: 'Authentic Silk' }
              ].map((stat, index) => (
                <div key={index}>
                  <div style={{ 
                    fontSize: '40px', 
                    fontWeight: 700, 
                    color: '#d4a574',
                    marginBottom: '8px'
                  }}>
                    {stat.number}
                  </div>
                  <div style={{ 
                    fontSize: '16px', 
                    color: '#666',
                    fontWeight: 500
                  }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* CTA Section */}
        <section style={{ marginBottom: '40px', textAlign: 'center' }}>
          <motion.div
            variants={cardReveal}
            initial="initial"
            animate="animate"
          >
            <h2 style={{ 
              fontSize: '36px', 
              marginBottom: '20px',
              color: '#1a1a1a'
            }}>
              Ready to Find Your Perfect Paithani?
            </h2>
            <p style={{ 
              fontSize: '18px', 
              color: '#666',
              marginBottom: '32px'
            }}>
              Browse our complete collection and discover timeless elegance
            </p>
            <Link
              href="/products"
              style={{
                display: 'inline-block',
                padding: '16px 48px',
                backgroundColor: '#d4a574',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: 600,
                transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(212, 165, 116, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#c19565';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(212, 165, 116, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#d4a574';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(212, 165, 116, 0.3)';
              }}
            >
              Explore Collection
            </Link>
          </motion.div>
        </section>

      </motion.div>
    </UserLayout>
  );
}
