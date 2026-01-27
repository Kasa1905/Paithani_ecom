'use client';

import { useState, useEffect } from 'react';

interface Settings {
  bannerImageUrl: string;
  slideshowImages: string[];
  isBannerVisible: boolean;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    bannerImageUrl: '',
    slideshowImages: [],
    isBannerVisible: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/settings', {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Failed to fetch settings');
      }
      const data = await res.json();
      setSettings(data.settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save settings');
      }
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      // Step 1: Upload to Cloudinary via /api/upload (proven endpoint)
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);
      
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include',
        body: uploadFormData,
      });

      if (!uploadRes.ok) {
        const uploadData = await uploadRes.json();
        throw new Error(uploadData.error || 'Failed to upload image to Cloudinary');
      }

      const uploadData = await uploadRes.json();
      const imageUrl = uploadData.imageUrl;

      if (!imageUrl) {
        throw new Error('No image URL returned from Cloudinary');
      }

      // Step 2: Save Cloudinary URL to MongoDB via /api/admin/settings
      const saveRes = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          bannerImageUrl: imageUrl,
        }),
      });

      if (!saveRes.ok) {
        const saveData = await saveRes.json();
        throw new Error(saveData.error || 'Failed to save banner URL to database');
      }

      const saveData = await saveRes.json();
      setSettings(saveData.settings);
      setSuccess('Banner uploaded to Cloudinary and saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload banner');
    } finally {
      setUploading(false);
    }
  };

  const handleSlideshowUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError('');

    try {
      const uploadedUrls: string[] = [];

      // Upload each file to Cloudinary
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const uploadFormData = new FormData();
        uploadFormData.append('image', file);

        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          credentials: 'include',
          body: uploadFormData,
        });

        if (!uploadRes.ok) {
          const uploadData = await uploadRes.json();
          throw new Error(uploadData.error || `Failed to upload image ${i + 1}`);
        }

        const uploadData = await uploadRes.json();
        const imageUrl = uploadData.imageUrl;

        if (!imageUrl) {
          throw new Error(`No image URL returned for image ${i + 1}`);
        }

        uploadedUrls.push(imageUrl);
      }

      // Save all uploaded URLs to MongoDB in one call
      const newSlideshowImages = [...settings.slideshowImages, ...uploadedUrls];
      const saveRes = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          slideshowImages: newSlideshowImages,
        }),
      });

      if (!saveRes.ok) {
        const saveData = await saveRes.json();
        throw new Error(saveData.error || 'Failed to save slideshow images to database');
      }

      const saveData = await saveRes.json();
      setSettings(saveData.settings);
      setSuccess(`${uploadedUrls.length} slideshow image(s) uploaded to Cloudinary and saved successfully!`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload slideshow images');
    } finally {
      setUploading(false);
    }
  };

  const removeSlideshow = (index: number) => {
    setSettings({
      ...settings,
      slideshowImages: settings.slideshowImages.filter((_, i) => i !== index),
    });
  };

  const handleSaveSlideshowChanges = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          slideshowImages: settings.slideshowImages,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save changes');
      }
      setSuccess('Slideshow changes saved!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '80px 20px',
        textAlign: 'center',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚙️</div>
        <h2 style={{ fontSize: '24px', color: '#666' }}>Loading Store Settings...</h2>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '40px 32px',
      maxWidth: '1200px',
      margin: '0 auto',
      backgroundColor: '#fafafa',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ 
          fontSize: '36px',
          fontWeight: 700,
          color: '#1a1a1a',
          marginBottom: '12px',
          letterSpacing: '-0.03em'
        }}>
          Store & Brand Settings
        </h1>
        <p style={{ 
          fontSize: '16px',
          color: '#666',
          lineHeight: 1.6,
          margin: 0
        }}>
          Manage your brand identity and store appearance. Changes here affect how customers see your business.
        </p>
      </div>

      {/* Status Messages */}
      {error && (
        <div style={{
          padding: '16px 20px',
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '8px',
          marginBottom: '24px',
          color: '#c00',
          fontSize: '15px'
        }}>
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div style={{
          padding: '16px 20px',
          backgroundColor: '#d4f8e8',
          border: '1px solid #7ce0b4',
          borderRadius: '8px',
          marginBottom: '24px',
          color: '#0a5d3a',
          fontSize: '15px'
        }}>
          ✓ {success}
        </div>
      )}
      {uploading && (
        <div style={{
          padding: '16px 20px',
          backgroundColor: '#e6f3ff',
          border: '1px solid #99ccff',
          borderRadius: '8px',
          marginBottom: '24px',
          color: '#0066cc',
          fontSize: '15px'
        }}>
          ⏳ Uploading...
        </div>
      )}

      {/* Settings Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveSettings();
        }}
      >
        {/* Brand Identity Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e8e8e8',
          marginBottom: '24px',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '24px 28px',
            borderBottom: '1px solid #e8e8e8',
            backgroundColor: '#fafafa'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 600,
              color: '#1a1a1a',
              margin: '0 0 6px 0',
              letterSpacing: '-0.02em'
            }}>
              🏷️ Brand Identity
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#666',
              margin: 0,
              lineHeight: 1.5
            }}>
              Your brand name and logo appear throughout the store
            </p>
          </div>
          <div style={{ padding: '28px' }}>
            {/* Brand Name - Placeholder for future */}
            <div style={{
              padding: '20px',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              border: '1px dashed #d0d0d0',
              textAlign: 'center',
              color: '#666'
            }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '15px' }}>
                🏪 Brand name and logo customization coming soon
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: '#999' }}>
                Currently showing: Paithani
              </p>
            </div>
          </div>
        </div>

        {/* Homepage Visuals Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e8e8e8',
          marginBottom: '24px',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '24px 28px',
            borderBottom: '1px solid #e8e8e8',
            backgroundColor: '#fafafa'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 600,
              color: '#1a1a1a',
              margin: '0 0 6px 0',
              letterSpacing: '-0.02em'
            }}>
              🖼️ Homepage Featured Slideshow
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#666',
              margin: 0,
              lineHeight: 1.5
            }}>
              Showcase your best products in the homepage featured section. Recommended: 3-5 high-quality images (1200×600px or similar).
            </p>
          </div>
          <div style={{ padding: '28px' }}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '12px',
                fontWeight: 600,
                fontSize: '15px',
                color: '#333'
              }}>
                Upload Slideshow Images
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleSlideshowUpload}
                disabled={uploading}
                style={{
                  padding: '12px',
                  border: '2px dashed #d0d0d0',
                  borderRadius: '8px',
                  width: '100%',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              />
              <p style={{
                fontSize: '13px',
                color: '#999',
                marginTop: '8px',
                margin: 0
              }}>
                Select multiple images to upload at once
              </p>
            </div>

            {settings.slideshowImages.length > 0 ? (
              <div>
                <p style={{
                  fontWeight: 600,
                  fontSize: '15px',
                  marginBottom: '16px',
                  color: '#333'
                }}>
                  Current Slideshow ({settings.slideshowImages.length} {settings.slideshowImages.length === 1 ? 'image' : 'images'})
                </p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '16px',
                  marginBottom: '20px'
                }}>
                  {settings.slideshowImages.map((url, index) => (
                    <div
                      key={index}
                      style={{
                        position: 'relative',
                        borderRadius: '8px',
                        border: '1px solid #e8e8e8',
                        overflow: 'hidden',
                        backgroundColor: '#fafafa'
                      }}
                    >
                      <img
                        src={url}
                        alt={`Slide ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '140px',
                          objectFit: 'cover',
                          display: 'block'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeSlideshow(index)}
                        style={{
                          width: '100%',
                          padding: '10px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '14px',
                          fontWeight: 500,
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#c82333';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#dc3545';
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleSaveSlideshowChanges}
                  disabled={saving || uploading}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: saving || uploading ? '#ccc' : '#d4a574',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: saving || uploading ? 'not-allowed' : 'pointer',
                    fontSize: '15px',
                    fontWeight: 600,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (!saving && !uploading) {
                      e.currentTarget.style.backgroundColor = '#c49564';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!saving && !uploading) {
                      e.currentTarget.style.backgroundColor = '#d4a574';
                    }
                  }}
                >
                  {saving ? 'Saving Changes...' : 'Save Slideshow'}
                </button>
              </div>
            ) : (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
                backgroundColor: '#f9f9f9',
                borderRadius: '8px',
                border: '1px dashed #d0d0d0'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📸</div>
                <p style={{
                  fontSize: '15px',
                  color: '#666',
                  margin: '0 0 6px 0'
                }}>
                  No slideshow images yet
                </p>
                <p style={{
                  fontSize: '13px',
                  color: '#999',
                  margin: 0
                }}>
                  Upload your first featured product image above
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Homepage Banner Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e8e8e8',
          marginBottom: '24px',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '24px 28px',
            borderBottom: '1px solid #e8e8e8',
            backgroundColor: '#fafafa'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 600,
              color: '#1a1a1a',
              margin: '0 0 6px 0',
              letterSpacing: '-0.02em'
            }}>
              🎨 Homepage Banner
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#666',
              margin: 0,
              lineHeight: 1.5
            }}>
              Optional hero banner for promotions or announcements
            </p>
          </div>
          <div style={{ padding: '28px' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: 500
              }}>
                <input
                  type="checkbox"
                  checked={settings.isBannerVisible}
                  onChange={(e) =>
                    setSettings({ ...settings, isBannerVisible: e.target.checked })
                  }
                  style={{
                    width: '18px',
                    height: '18px',
                    marginRight: '10px',
                    cursor: 'pointer'
                  }}
                />
                Show banner on homepage
              </label>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '12px',
                fontWeight: 600,
                fontSize: '15px',
                color: '#333'
              }}>
                Upload Banner Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleBannerUpload}
                disabled={uploading}
                style={{
                  padding: '12px',
                  border: '2px dashed #d0d0d0',
                  borderRadius: '8px',
                  width: '100%',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              />
            </div>

            {settings.bannerImageUrl ? (
              <div>
                <p style={{
                  fontWeight: 600,
                  fontSize: '15px',
                  marginBottom: '12px',
                  color: '#333'
                }}>
                  Current Banner
                </p>
                <img
                  src={settings.bannerImageUrl}
                  alt="Banner"
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                    maxHeight: '240px',
                    border: '1px solid #e8e8e8',
                    borderRadius: '8px',
                    display: 'block'
                  }}
                />
              </div>
            ) : (
              <div style={{
                padding: '32px 20px',
                textAlign: 'center',
                backgroundColor: '#f9f9f9',
                borderRadius: '8px',
                border: '1px dashed #d0d0d0'
              }}>
                <p style={{
                  fontSize: '14px',
                  color: '#999',
                  margin: 0
                }}>
                  No banner image uploaded
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Contact Information Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          border: '1px solid #e8e8e8',
          marginBottom: '32px',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '24px 28px',
            borderBottom: '1px solid #e8e8e8',
            backgroundColor: '#fafafa'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 600,
              color: '#1a1a1a',
              margin: '0 0 6px 0',
              letterSpacing: '-0.02em'
            }}>
              📞 Store Contact Information
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#666',
              margin: 0,
              lineHeight: 1.5
            }}>
              Customer-facing contact details for support and inquiries
            </p>
          </div>
          <div style={{ padding: '28px' }}>
            <div style={{
              padding: '20px',
              backgroundColor: '#f9f9f9',
              borderRadius: '8px',
              border: '1px dashed #d0d0d0',
              textAlign: 'center',
              color: '#666'
            }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '15px' }}>
                📧 Contact information management coming soon
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: '#999' }}>
                Email, phone, and address fields will be added here
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          paddingTop: '8px'
        }}>
          <button
            type="submit"
            disabled={saving || uploading}
            style={{
              padding: '14px 32px',
              backgroundColor: saving || uploading ? '#ccc' : '#1f2937',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              cursor: saving || uploading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!saving && !uploading) {
                e.currentTarget.style.backgroundColor = '#111827';
              }
            }}
            onMouseLeave={(e) => {
              if (!saving && !uploading) {
                e.currentTarget.style.backgroundColor = '#1f2937';
              }
            }}
          >
            {saving ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
