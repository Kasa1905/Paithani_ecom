'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { pageTransition, staggerContainer, staggerItem, rowHover } from '@/lib/animations';

type StatusCount = { _id: string; count: number };
type Overview = {
  totalOrders: number;
  totalRevenue: number;
  ordersByStatus: StatusCount[];
};

type BestSeller = {
  productId: string;
  title: string;
  category: string;
  stock: number;
  totalQuantity: number;
};

type LowStock = {
  _id: string;
  title: string;
  category: string;
  stock: number;
  isActive: boolean;
  isOutOfStock: boolean;
};

type RangeOption = 'today' | '7d' | '30d' | 'all';

export default function AdminAnalyticsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [range, setRange] = useState<RangeOption>('7d');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [bestSelling, setBestSelling] = useState<BestSeller[]>([]);
  const [lowStock, setLowStock] = useState<LowStock[]>([]);
  const [lowStockThreshold, setLowStockThreshold] = useState<number>(5);
  const [error, setError] = useState('');
  const [loadingData, setLoadingData] = useState(true);

  // Redirect non-admin users
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'admin') {
      router.push('/');
    }
  }, [user, loading, router]);

  const rangeLabel = useMemo(() => {
    switch (range) {
      case 'today':
        return 'Today';
      case '7d':
        return 'Last 7 days';
      case '30d':
        return 'Last 30 days';
      default:
        return 'All time';
    }
  }, [range]);

  const fetchData = async () => {
    setLoadingData(true);
    setError('');
    try {
      const overviewRes = await fetch(`/api/admin/analytics/overview?range=${range}`, {
        credentials: 'include',
      });
      if (!overviewRes.ok) {
        throw new Error('Failed to load overview');
      }
      const overviewData = await overviewRes.json();

      const productsRes = await fetch(
        `/api/admin/analytics/products?range=${range}&threshold=${lowStockThreshold}`,
        { credentials: 'include' }
      );
      if (!productsRes.ok) {
        throw new Error('Failed to load product analytics');
      }
      const productData = await productsRes.json();

      setOverview(overviewData);
      setBestSelling(productData.bestSellingProducts || []);
      setLowStock(productData.lowStockProducts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, lowStockThreshold]);

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading...</div>;
  }

  return (
    <motion.div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }} {...pageTransition}>
      <motion.div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }} variants={staggerItem} initial="initial" animate="animate">
        <h1 style={{ margin: 0 }}>Analytics Dashboard</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Range:</span>
            <select 
              value={range} 
              onChange={(e) => setRange(e.target.value as RangeOption)}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d0d0d0' }}
            >
              <option value="today">Today</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="all">All time</option>
            </select>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Low stock ≤</span>
            <input
              type="number"
              min={1}
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(Math.max(1, Number(e.target.value) || 1))}
              style={{ width: '80px', padding: '8px', borderRadius: '6px', border: '1px solid #d0d0d0' }}
            />
          </label>
          <motion.button 
            onClick={fetchData} 
            disabled={loadingData} 
            style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#d4a574', color: 'white', cursor: loadingData ? 'wait' : 'pointer', fontWeight: 600 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Refresh
          </motion.button>
        </div>
      </motion.div>

      {error && (
        <motion.div style={{ color: 'red' }} variants={staggerItem} initial="initial" animate="animate">Error: {error}</motion.div>
      )}

      {loadingData ? (
        <div>Loading analytics...</div>
      ) : (
        <>
          {/* Overview Cards */}
          <motion.div 
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            <motion.div className="card-raise" variants={staggerItem} style={{ border: '1px solid #e0e0e0', borderRadius: '12px', padding: '16px', background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }} whileHover={{ y: -2, boxShadow: '0 8px 16px rgba(0,0,0,0.08)' }} transition={{ duration: 0.24 }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Total Orders ({rangeLabel})</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#1f2937' }}>{overview?.totalOrders ?? 0}</div>
            </motion.div>
            <motion.div className="card-raise" variants={staggerItem} style={{ border: '1px solid #e0e0e0', borderRadius: '12px', padding: '16px', background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }} whileHover={{ y: -2, boxShadow: '0 8px 16px rgba(0,0,0,0.08)' }} transition={{ duration: 0.24 }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Total Revenue ({rangeLabel})</div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: '#d4a574' }}>₹{(overview?.totalRevenue ?? 0).toFixed(2)}</div>
            </motion.div>
            <motion.div className="card-raise" variants={staggerItem} style={{ border: '1px solid #e0e0e0', borderRadius: '12px', padding: '16px', background: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }} whileHover={{ y: -2, boxShadow: '0 8px 16px rgba(0,0,0,0.08)' }} transition={{ duration: 0.24 }}>
              <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>Orders by Status</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                {(overview?.ordersByStatus || []).map((row) => (
                  <span key={row._id} style={{ padding: '6px 10px', border: '1px solid #e0e0e0', borderRadius: '6px', background: '#f9f9f9', fontSize: '13px' }}>
                    {row._id || 'unknown'}: <strong>{row.count}</strong>
                  </span>
                ))}
                {(overview?.ordersByStatus || []).length === 0 && <span style={{ color: '#999', fontSize: '13px' }}>No data</span>}
              </div>
            </motion.div>
          </motion.div>

          {/* Best Sellers */}
          <motion.div variants={staggerItem} initial="initial" animate="animate">
            <h2 style={{ margin: '16px 0 12px 0' }}>Best Selling Products ({rangeLabel})</h2>
            {bestSelling.length === 0 ? (
              <div style={{ color: '#666' }}>No delivered orders in this range.</div>
            ) : (
              <motion.table className="table-row-hover" style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e0e0e0', borderRadius: '12px', overflow: 'hidden' }} variants={staggerContainer} initial="initial" animate="animate">
                <thead>
                  <tr style={{ background: '#f9f9f9', borderBottom: '1px solid #e0e0e0' }}>
                    <th style={{ textAlign: 'left', padding: '12px', fontWeight: 600 }}>Product</th>
                    <th style={{ textAlign: 'left', padding: '12px', fontWeight: 600 }}>Category</th>
                    <th style={{ textAlign: 'right', padding: '12px', fontWeight: 600 }}>Qty Sold</th>
                    <th style={{ textAlign: 'right', padding: '12px', fontWeight: 600 }}>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {bestSelling.map((p) => (
                    <motion.tr key={p.productId} variants={staggerItem} whileHover={{ backgroundColor: 'rgba(212, 165, 116, 0.05)' }} style={{ borderBottom: '1px solid #f0f0f0', transition: 'background-color 0.16s ease' }}>
                      <td style={{ padding: '12px' }}>{p.title}</td>
                      <td style={{ padding: '12px', color: '#666' }}>{p.category}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>{p.totalQuantity}</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{p.stock}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </motion.table>
            )}
          </motion.div>

          {/* Low Stock */}
          <motion.div variants={staggerItem} initial="initial" animate="animate">
            <h2 style={{ margin: '16px 0 12px 0' }}>Low Stock (≤ {lowStockThreshold})</h2>
            {lowStock.length === 0 ? (
              <div style={{ color: '#666' }}>All good — no low stock items.</div>
            ) : (
              <motion.table className="table-row-hover" style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e0e0e0', borderRadius: '12px', overflow: 'hidden' }} variants={staggerContainer} initial="initial" animate="animate">
                <thead>
                  <tr style={{ background: '#f9f9f9', borderBottom: '1px solid #e0e0e0' }}>
                    <th style={{ textAlign: 'left', padding: '12px', fontWeight: 600 }}>Product</th>
                    <th style={{ textAlign: 'left', padding: '12px', fontWeight: 600 }}>Category</th>
                    <th style={{ textAlign: 'right', padding: '12px', fontWeight: 600 }}>Stock</th>
                    <th style={{ textAlign: 'left', padding: '12px', fontWeight: 600 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((p) => (
                    <motion.tr key={p._id} variants={staggerItem} whileHover={{ backgroundColor: 'rgba(220, 53, 69, 0.05)' }} style={{ borderBottom: '1px solid #f0f0f0', transition: 'background-color 0.16s ease' }}>
                      <td style={{ padding: '12px' }}>{p.title}</td>
                      <td style={{ padding: '12px', color: '#666' }}>{p.category}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: p.stock === 0 ? '#dc3545' : '#ff9800' }}>{p.stock}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ 
                          padding: '4px 8px', 
                          borderRadius: '4px', 
                          fontSize: '12px', 
                          fontWeight: 600,
                          background: p.isOutOfStock ? 'rgba(220, 53, 69, 0.1)' : 'rgba(255, 152, 0, 0.1)',
                          color: p.isOutOfStock ? '#dc3545' : '#ff9800'
                        }}>
                          {p.isOutOfStock ? 'Out of stock' : p.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </motion.table>
            )}
          </motion.div>
        </>
      )}
    </motion.div>
  );
}