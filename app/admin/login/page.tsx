'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './adminLogin.module.css';

const parseJsonSafe = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

export default function AdminLoginPage() {
  const { refreshUser, isAuthenticated, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in as admin (only after auth loads)
  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === 'admin') {
      router.push('/admin/dashboard');
    }
  }, [authLoading, isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        // Refresh user to get updated role
        const updatedUser = await refreshUser();
        
        // Check if user is admin
        if (updatedUser?.role === 'admin') {
          // Admin login successful
          router.push('/admin/dashboard');
        } else {
          // User logged in but is NOT an admin
          setError('❌ Not authorized as admin. Please log in with an admin account.');
        }
      } else {
        const data = await parseJsonSafe(response);
        setError(data?.message || 'Login failed');
      }
    } catch (err) {
      console.error('Admin login error:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <h1 className={styles.title}>🔐 Admin Login</h1>
        <p className={styles.subtitle}>Access the admin panel</p>
        
        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="admin-email">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              id="admin-email"
              placeholder="admin@example.com"
              className={styles.input}
              disabled={loading}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="admin-password">Password</label>
            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                id="admin-password"
                placeholder="••••••••"
                className={styles.input}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={styles.toggleBtn}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
                disabled={loading}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={styles.submit}
          >
            {loading ? 'Logging in...' : 'Login as Admin'}
          </button>
        </form>

        <div className={styles.center}>
          <Link href="/login" className={styles.link}>
            ← Back to user login
          </Link>
        </div>
      </div>
    </div>
  );
}
