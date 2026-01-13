'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AdminLayout } from '@/app/shared/layouts/AdminLayout';

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for auth to load, then check role
    if (!loading) {
      if (!user || user.role !== 'admin') {
        router.push('/');
      }
    }
  }, [user, loading, router]);

  // Show loading state while checking auth
  if (loading) {
    return <div>Loading...</div>;
  }

  // Show nothing if not admin (will redirect)
  if (!user || user.role !== 'admin') {
    return null;
  }

  // Render admin layout for admin users
  return <AdminLayout>{children}</AdminLayout>;
}
