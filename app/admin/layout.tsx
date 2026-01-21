'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AdminLayout } from '@/app/shared/layouts/AdminLayout';

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Allow /admin/login to be accessible without admin role
  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    // Wait for auth to load, then check role
    if (!loading) {
      // Only redirect if NOT on login page AND user is not admin
      if (!isLoginPage && (!user || user.role !== 'admin')) {
        router.push('/');
      }
    }
  }, [user, loading, router, isLoginPage]);

  // Show loading state while checking auth
  if (loading) {
    return <div>Loading...</div>;
  }

  // If on login page, allow access (even if not admin)
  if (isLoginPage) {
    return <>{children}</>;
  }

  // For other admin pages: show nothing if not admin (will redirect)
  if (!user || user.role !== 'admin') {
    return null;
  }

  // Render admin layout for admin users
  return <AdminLayout>{children}</AdminLayout>;
}
