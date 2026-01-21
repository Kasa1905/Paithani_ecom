'use client';

import { useAuth } from '@/context/AuthContext';
import UserNavbar from './UserNavbar';
import AdminNavbar from './AdminNavbar';

export default function Navbar() {
  const { user, loading } = useAuth();

  // Don't render anything while loading to prevent flash
  if (loading) {
    return null;
  }

  // Show admin navbar only for admin users
  if (user?.role === 'admin') {
    return <AdminNavbar />;
  }

  // Show user navbar for everyone else (logged in or not)
  return <UserNavbar />;
}
