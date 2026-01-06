import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Paithani E-Commerce',
  description: 'E-commerce platform for Paithani sarees',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
