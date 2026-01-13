'use client';

import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/**
 * UserHeader Component
 * Example of a header component that displays user info and logout button
 * 
 * - Shows user name and email if logged in
 * - Shows "Login" link if not logged in
 * - Handles logout with redirect
 * - Shows loading state during initial auth check
 */
export default function UserHeader() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <header className="bg-white shadow sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo/Home Link */}
        <Link href="/" className="text-2xl font-bold text-blue-600">
          Paithani
        </Link>

        {/* Auth Section */}
        <div className="flex items-center gap-4">
          {loading ? (
            // Loading state
            <div className="text-sm text-gray-600">Loading...</div>
          ) : isAuthenticated && user ? (
            // Logged in state
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-semibold">{user.name}</p>
                <p className="text-xs text-gray-600">{user.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
              >
                Logout
              </button>
            </div>
          ) : (
            // Not logged in state
            <Link
              href="/login"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
