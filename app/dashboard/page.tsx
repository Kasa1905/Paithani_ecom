'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';

/**
 * DashboardContent Component
 * Demonstrates how to use the useAuth hook in a protected component
 */
function DashboardContent() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Welcome, {user?.name}!</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-100 p-4 rounded">
              <p className="text-sm text-gray-600">Email</p>
              <p className="text-lg font-semibold">{user?.email}</p>
            </div>

            <div className="bg-gray-100 p-4 rounded">
              <p className="text-sm text-gray-600">Role</p>
              <p className="text-lg font-semibold capitalize">{user?.role}</p>
            </div>

            <div className="bg-gray-100 p-4 rounded">
              <p className="text-sm text-gray-600">User ID</p>
              <p className="text-lg font-semibold">{user?.id}</p>
            </div>

            <div className="bg-gray-100 p-4 rounded">
              <p className="text-sm text-gray-600">Auth Status</p>
              <p className="text-lg font-semibold">
                {loading ? 'Loading...' : 'Authenticated'}
              </p>
            </div>
          </div>

          {/* Demo: Refresh User Button */}
          <div className="mt-6 pt-6 border-t">
            <p className="text-gray-600 mb-3">
              Click &quot;Refresh User&quot; to manually sync auth state from server:
            </p>
            <RefreshUserButton />
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * RefreshUserButton Component
 * Demonstrates how to call refreshUser() to sync auth state
 */
function RefreshUserButton() {
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await refreshUser();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={loading}
      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? 'Refreshing...' : 'Refresh User'}
    </button>
  );
}

// Add missing import
import { useState } from 'react';

/**
 * Dashboard Page
 * Wrapped with ProtectedRoute to ensure only authenticated users can access
 */
export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
