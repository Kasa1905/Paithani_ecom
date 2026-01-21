'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export function AdminLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Main Content - sidebar removed, navbar handles navigation */}
      <main style={{ padding: '20px' }}>
        {children}
      </main>
    </div>
  );
}
