import React, { ReactNode } from 'react';

interface UserLayoutProps {
  children: ReactNode;
}

export function UserLayout({ children }: UserLayoutProps) {
  return (
    <div className="user-layout">
      <header>
        <nav>User Navigation</nav>
      </header>
      <main>{children}</main>
      <footer>User Footer</footer>
    </div>
  );
}
