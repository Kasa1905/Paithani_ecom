'use client';

import React, { ReactNode } from 'react';

interface UserLayoutProps {
  children: ReactNode;
}

export function UserLayout({ children }: UserLayoutProps) {
  return (
    <main>{children}</main>
  );
}
