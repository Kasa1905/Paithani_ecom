'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';

/**
 * ProtectedRoute Component
 * Wraps components that require authentication
 * 
 * - Checks if user is authenticated
 * - Shows loading state while checking auth
 * - Redirects to login if not authenticated
 * - Renders children if authenticated
 */
interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'user' | 'admin';
}

export default function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait for loading to finish
    if (loading) return;

    // Not authenticated, redirect to login
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // Check role if required
    if (requiredRole && user?.role !== requiredRole) {
      router.push('/');
      return;
    }
  }, [loading, isAuthenticated, user?.role, requiredRole, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null; // Redirect will happen in useEffect
  }

  // Check role
  if (requiredRole && user?.role !== requiredRole) {
    return null; // Redirect will happen in useEffect
  }

  // Authenticated and authorized
  return <>{children}</>;
}
