import React, { ReactNode } from 'react';
import { redirect } from 'next/navigation';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  // Mock authentication
  const isAuthenticated = true;

  if (!isAuthenticated) {
    redirect('/');
  }

  return <>{children}</>;
}
