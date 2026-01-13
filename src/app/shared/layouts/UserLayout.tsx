'use client';

import React, { ReactNode } from 'react';
import Header from '@/components/Header';

interface UserLayoutProps {
  children: ReactNode;
}

export function UserLayout({ children }: UserLayoutProps) {
  return (
    <div>
      <Header />
      <main>{children}</main>
    </div>
  );
}
