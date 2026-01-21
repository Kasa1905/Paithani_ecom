'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to admin orders when accessing /admin
    router.replace('/admin/orders');
  }, [router]);

  return null;
}
