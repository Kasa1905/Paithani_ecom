import React, { ReactNode } from 'react';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="admin-layout">
      <header>
        <nav>Admin Navigation</nav>
      </header>
      <main>{children}</main>
      <footer>Admin Footer</footer>
    </div>
  );
}
