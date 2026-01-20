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
    return <div>Loading settings...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Site Settings</h1>

      {error && <p style={{ color: 'red', fontWeight: 600 }}>{error}</p>}
      {success && <p style={{ color: 'green', fontWeight: 600 }}>{success}</p>}
      {uploading && <p style={{ color: '#007bff', fontWeight: 600 }}>Uploading...</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveSettings();
        }}
      >
        {/* Banner Settings */}
        <fieldset style={{ marginBottom: '24px', padding: '16px', border: '1px solid #ddd' }}>
          <legend style={{ fontWeight: 600, fontSize: '18px' }}>Homepage Banner</legend>

          <div style={{ marginBottom: '12px' }}>
            <label>
              <input
                type="checkbox"
                checked={settings.isBannerVisible}
                onChange={(e) =>
                  setSettings({ ...settings, isBannerVisible: e.target.checked })
                }
              />
              {' '}Banner Visible
            </label>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
              Upload Banner Image from Local Device:
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleBannerUpload}
              disabled={uploading}
              style={{ padding: '8px' }}
            />
          </div>

          {settings.bannerImageUrl && (
            <div style={{ marginTop: '12px' }}>
              <p style={{ fontWeight: 600 }}>Current Banner:</p>
              <img
                src={settings.bannerImageUrl}
                alt="Banner"
                style={{ maxWidth: '400px', maxHeight: '200px', border: '1px solid #ddd' }}
              />
              <p style={{ fontSize: '14px', color: '#666' }}>{settings.bannerImageUrl}</p>
            </div>
          )}
        </fieldset>

        {/* Slideshow Settings */}
        <fieldset style={{ marginBottom: '24px', padding: '16px', border: '1px solid #ddd' }}>
          <legend style={{ fontWeight: 600, fontSize: '18px' }}>Homepage Slideshow</legend>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>
              Upload Slideshow Images from Local Device:
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleSlideshowUpload}
              disabled={uploading}
              style={{ padding: '8px' }}
            />
          </div>

          {settings.slideshowImages.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <p style={{ fontWeight: 600 }}>Current Slideshow Images ({settings.slideshowImages.length}):</p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
                {settings.slideshowImages.map((url, index) => (
                  <div
                    key={index}
                    style={{
                      position: 'relative',
                      width: '150px',
                      border: '1px solid #ddd',
                      padding: '8px',
                      borderRadius: '4px',
                    }}
                  >
                    <img
                      src={url}
                      alt={`Slide ${index + 1}`}
                      style={{ width: '100%', height: '100px', objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      onClick={() => removeSlideshow(index)}
                      style={{
                        marginTop: '8px',
                        width: '100%',
                        padding: '4px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
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
                   marginTop: '12px',
                   padding: '8px 16px',
                   backgroundColor: saving || uploading ? '#ccc' : '#007bff',
                   color: 'white',
                   border: 'none',
                   borderRadius: '4px',
                   cursor: saving || uploading ? 'not-allowed' : 'pointer',
                 }}
               >
                 {saving ? 'Saving...' : 'Save Changes'}
               </button>
            </div>
          )}
        </fieldset>

          {/* Only show save button for banner visibility toggle */}
          <button
          type="submit"
          disabled={saving || uploading}
          style={{
            padding: '12px 24px',
            backgroundColor: saving || uploading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: saving || uploading ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
