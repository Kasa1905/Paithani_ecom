'use client';

import { useState, useEffect } from 'react';
import { UserLayout } from '@/app/shared/layouts/UserLayout';
import { useAuth } from '@/context/AuthContext';

interface SiteSettings {
  bannerImageUrl: string;
  slideshowImages: string[];
  isBannerVisible: boolean;
}

export default function Page() {
  const { user, loading } = useAuth();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
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

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    // Auto-advance slideshow every 3 seconds
    if (settings && settings.slideshowImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % settings.slideshowImages.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [settings]);

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

        {/* Slideshow Section */}
        {settings?.slideshowImages && settings.slideshowImages.length > 0 && (
          <div style={{ margin: '20px 0' }}>
            <h2>Featured Collections</h2>
            <div style={{ position: 'relative', maxWidth: '800px' }}>
              <img
                src={settings.slideshowImages[currentSlide]}
                alt={`Slide ${currentSlide + 1}`}
                style={{ width: '100%', height: 'auto' }}
              />
              <div style={{ marginTop: '10px', textAlign: 'center' }}>
                {settings.slideshowImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    style={{
                      margin: '0 5px',
                      padding: '5px 10px',
                      background: index === currentSlide ? '#333' : '#ccc',
                      color: index === currentSlide ? '#fff' : '#000',
                      border: 'none',
                      cursor: 'pointer',
                    }}
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
