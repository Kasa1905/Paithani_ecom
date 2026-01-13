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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newSlideUrl, setNewSlideUrl] = useState('');

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

  const addSlideshow = () => {
    if (newSlideUrl.trim()) {
      setSettings({
        ...settings,
        slideshowImages: [...settings.slideshowImages, newSlideUrl.trim()],
      });
      setNewSlideUrl('');
    }
  };

  const removeSlideshow = (index: number) => {
    setSettings({
      ...settings,
      slideshowImages: settings.slideshowImages.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return <div>Loading settings...</div>;
  }

  return (
    <div>
      <h1>Site Settings</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          saveSettings();
        }}
      >
        {/* Banner Settings */}
        <fieldset>
          <legend>Homepage Banner</legend>

          <div>
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

          <div style={{ marginTop: '10px' }}>
            <label>
              Banner Image URL:
              <br />
              <input
                type="text"
                value={settings.bannerImageUrl}
                onChange={(e) =>
                  setSettings({ ...settings, bannerImageUrl: e.target.value })
                }
                placeholder="https://example.com/banner.jpg"
                style={{ width: '100%', maxWidth: '500px' }}
              />
            </label>
          </div>
        </fieldset>

        {/* Slideshow Settings */}
        <fieldset style={{ marginTop: '20px' }}>
          <legend>Homepage Slideshow</legend>

          <div>
            <label>
              Add Slideshow Image URL:
              <br />
              <input
                type="text"
                value={newSlideUrl}
                onChange={(e) => setNewSlideUrl(e.target.value)}
                placeholder="https://example.com/slide.jpg"
                style={{ width: '100%', maxWidth: '400px' }}
              />
            </label>
            <button type="button" onClick={addSlideshow} style={{ marginLeft: '10px' }}>
              Add
            </button>
          </div>

          <div style={{ marginTop: '15px' }}>
            <h3>Current Slideshow Images ({settings.slideshowImages.length})</h3>
            {settings.slideshowImages.length === 0 ? (
              <p>No slideshow images added yet.</p>
            ) : (
              <ul>
                {settings.slideshowImages.map((url, index) => (
                  <li key={index} style={{ marginBottom: '10px' }}>
                    <span style={{ wordBreak: 'break-all' }}>{url}</span>
                    <button
                      type="button"
                      onClick={() => removeSlideshow(index)}
                      style={{ marginLeft: '10px' }}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </fieldset>

        {/* Save Button */}
        <div style={{ marginTop: '20px' }}>
          <button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
