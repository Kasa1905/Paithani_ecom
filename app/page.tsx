'use client';

import { useState, useEffect } from 'react';
import { UserLayout } from '@/app/shared/layouts/UserLayout';
import { useAuth } from '@/context/AuthContext';

interface Product {
  _id: string;
  title: string;
  images: string[];
}

interface SiteSettings {
  bannerImageUrl: string;
  isBannerVisible: boolean;
}

export default function Page() {
  const { user, loading } = useAuth();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
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
        setFeaturedProducts(featured);
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
      <div>
        <h1>Welcome to Paithani E-commerce</h1>

        {/* Banner Section */}
        {settings?.isBannerVisible && settings.bannerImageUrl && (
          <div style={{ margin: '20px 0' }}>
            <img
              src={settings.bannerImageUrl}
              alt="Homepage Banner"
              style={{ width: '100%', maxWidth: '800px', height: 'auto' }}
            />
          </div>
        )}

        {/* Slideshow Section - Featured Products */}
        {featuredProducts.length > 0 && (
          <div style={{ margin: '20px 0' }}>
            <h2>Featured Products</h2>
            <div style={{ position: 'relative', maxWidth: '800px' }}>
              <div style={{ 
                position: 'relative',
                width: '100%',
                height: '500px',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}>
                <img
                  src={featuredProducts[currentSlide].images[0]}
                  alt={featuredProducts[currentSlide].title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  padding: '16px',
                  textAlign: 'center',
                }}>
                  <h3 style={{ margin: 0, fontSize: '24px' }}>{featuredProducts[currentSlide].title}</h3>
                </div>
              </div>
              <div style={{ marginTop: '12px', textAlign: 'center' }}>
                {featuredProducts.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    style={{
                      margin: '0 5px',
                      padding: '6px 12px',
                      background: index === currentSlide ? '#1f2937' : '#4b5563',
                      color: '#ffffff',
                      border: '1px solid #111827',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                    aria-label={`Go to ${featuredProducts[index].title}`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* User Account Info */}
        {user && (
          <div style={{ marginTop: '30px' }}>
            <h2>Your Account</h2>
            <p>Name: {user.name}</p>
            <p>Email: {user.email}</p>
            <p>Role: <strong>{user.role}</strong></p>
            <p>User ID: {user.id}</p>
          </div>
        )}
      </div>
    </UserLayout>
  );
}
