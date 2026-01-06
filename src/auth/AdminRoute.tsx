import React, { ReactNode } from 'react';
import { redirect } from 'next/navigation';

interface AdminRouteProps {
  children: ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  // Mock admin authentication
  const isAdmin = true;

  if (!isAdmin) {
    redirect('/admin/login');
  }

  return <>{children}</>;
}
