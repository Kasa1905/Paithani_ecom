'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  totalOrders: number;
  pendingOrders: number;
  totalProducts: number;
  totalRevenue: number;
}

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingOrders: 0,
    totalProducts: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [ordersRes, productsRes] = await Promise.all([
          fetch('/api/admin/orders', { credentials: 'include' }),
          fetch('/api/products', { credentials: 'include' }),
        ]);

        const ordersData = await ordersRes.json();
        const productsData = await productsRes.json();

        const orders = ordersData.orders || [];
        const revenue = orders.reduce((sum: number, order: any) => sum + order.totalAmount, 0);
        const pending = orders.filter((o: any) => o.status === 'pending').length;

        setStats({
          totalOrders: orders.length,
          pendingOrders: pending,
          totalProducts: productsData.products?.length || 0,
          totalRevenue: revenue,
        });
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user && user.role === 'admin') {
      fetchStats();
    }
  }, [user]);

  if (authLoading || !user || user.role !== 'admin') {
    return <div style={{ padding: '20px' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: '30px' }}>Admin Dashboard</h1>

      {loading ? (
        <p>Loading statistics...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #ddd' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#666' }}>Total Orders</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0 }}>{stats.totalOrders}</p>
          </div>

          <div style={{ padding: '20px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#856404' }}>Pending Orders</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: '#856404' }}>{stats.pendingOrders}</p>
          </div>

          <div style={{ padding: '20px', backgroundColor: '#d4edda', borderRadius: '8px', border: '1px solid #28a745' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#155724' }}>Total Products</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: '#155724' }}>{stats.totalProducts}</p>
          </div>

          <div style={{ padding: '20px', backgroundColor: '#d1ecf1', borderRadius: '8px', border: '1px solid #17a2b8' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#0c5460' }}>Total Revenue</h3>
            <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, color: '#0c5460' }}>
              ${stats.totalRevenue.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      <div style={{ marginTop: '40px' }}>
        <h2>Quick Links</h2>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginTop: '20px' }}>
          <a href="/admin/orders/received" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
            Received Orders
          </a>
          <a href="/admin/orders/processing" style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
            Processing Orders
          </a>
          <a href="/admin/products" style={{ padding: '10px 20px', backgroundColor: '#17a2b8', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
            Manage Products
          </a>
          <a href="/admin/settings" style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
            Site Settings
          </a>
        </div>
      </div>
    </div>
  );
}
