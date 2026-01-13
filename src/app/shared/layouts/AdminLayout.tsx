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
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{ width: '250px', borderRight: '1px solid #ddd', padding: '20px' }}>
        <h2>Admin Panel</h2>
        <p>Welcome, {user?.name}</p>
        
        <nav>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: '10px' }}>
              <Link href="/admin/orders">Orders</Link>
            </li>
            <li style={{ marginBottom: '10px' }}>
              <Link href="/admin/orders/received">Received Orders</Link>
            </li>
            <li style={{ marginBottom: '10px' }}>
              <Link href="/admin/orders/processing">Active Orders</Link>
            </li>
            <li style={{ marginBottom: '10px' }}>
              <Link href="/admin/products">Products / Stock</Link>
            </li>
            <li style={{ marginBottom: '10px' }}>
              <Link href="/admin/settings">Site Settings</Link>
            </li>
            <li style={{ marginBottom: '10px' }}>
              <button onClick={handleLogout}>Logout</button>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '20px' }}>
        {children}
      </main>
    </div>
  );
}
