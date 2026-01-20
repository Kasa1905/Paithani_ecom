'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

/**
 * User object structure from /api/auth/me
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

/**
 * AuthContext type definition
 */
interface AuthContextType {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<User | null>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

/**
 * Create the Auth Context
 * - user: Current logged-in user or null
 * - loading: Whether initial auth check is in progress
 * - refreshUser: Function to refetch user data from server
 * - logout: Function to clear user state and call logout API
 * - isAuthenticated: Convenience boolean to check if user is logged in
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider Component
 * Wraps the application and manages global auth state
 * 
 * On mount:
 * 1. Sets loading = true
 * 2. Calls GET /api/auth/me with credentials: 'include' (for httpOnly cookies)
 * 3. If 200: Sets user from response
 * 4. If 401: Sets user = null (not logged in)
 * 5. Sets loading = false
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * refreshUser: Fetch current user from server
   * Called on mount and can be manually invoked after login/logout
   * Returns the user object or null if not authenticated
   */
  const refreshUser = async (): Promise<User | null> => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include', // Important: Include httpOnly cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Happy path
        const data = await response.json().catch(() => ({}));
        const userData = data.user ?? null;
        setUser(userData);
        return userData;
      }

      // Graceful handling of common error statuses
      if (response.status === 401 || response.status === 404) {
        // Treat both unauthorized and missing route as unauthenticated
        setUser(null);
        return null;
      }

      // Unexpected server/client error
      const statusText = response.statusText || `HTTP ${response.status}`;
      console.error('Error fetching user:', statusText);
      setUser(null);
      return null;
    } catch (error) {
      console.error('Failed to refresh user:', error);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * logout: Clear user state and optionally call logout API
   * Removes auth_token cookie on server side
   */
  const logout = async () => {
    try {
      // Optional: Call logout endpoint if it exists to clear server-side session
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      }).catch(() => {
        // If logout endpoint doesn't exist, that's okay
        // httpOnly cookie will be handled by server
      });

      // Clear client state
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
    }
  };

  /**
   * useEffect: On mount, check if user is already logged in
   * This runs once when AuthProvider is first rendered
   */
  useEffect(() => {
    refreshUser();
  }, []); // Empty dependency array = runs once on mount

  const value: AuthContextType = {
    user,
    loading,
    refreshUser,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth Hook
 * Use this hook in any client component to access auth state
 * 
 * Example:
 * const { user, loading, isAuthenticated, logout } = useAuth();
 * 
 * Throws error if used outside AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
