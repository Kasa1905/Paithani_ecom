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
    return (
      <div style={{ 
        padding: '80px 20px',
        textAlign: 'center',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔐</div>
        <h2 style={{ fontSize: '24px', color: '#666', marginBottom: '12px' }}>
          {authLoading ? 'Verifying access...' : 'Admin Access Required'}
        </h2>
        <p style={{ color: '#999' }}>
          {authLoading ? 'Please wait...' : 'You need admin privileges to view this page'}
        </p>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '40px 32px',
      maxWidth: '1400px',
      margin: '0 auto',
      backgroundColor: '#fafafa',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '48px' }}>
        <h1 style={{ 
          fontSize: '36px',
          fontWeight: 700,
          color: '#1a1a1a',
          marginBottom: '12px',
          letterSpacing: '-0.03em'
        }}>
          Business Dashboard
        </h1>
        <p style={{ 
          fontSize: '16px',
          color: '#666',
          margin: 0,
          lineHeight: 1.6
        }}>
          Welcome back, {user.name}. Monitor your store performance and manage operations from here.
        </p>
      </div>

      {/* Key Metrics */}
      {loading ? (
        <div style={{
          padding: '60px',
          textAlign: 'center',
          backgroundColor: 'white',
          borderRadius: '16px',
          border: '1px solid #e8e8e8'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: '#666', fontSize: '16px' }}>Loading dashboard data...</p>
        </div>
      ) : (
        <>
          {/* Overview Section Header */}
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ 
              fontSize: '22px',
              fontWeight: 600,
              color: '#1a1a1a',
              marginBottom: '8px',
              letterSpacing: '-0.02em'
            }}>
              📊 Store Overview
            </h2>
            <p style={{ 
              fontSize: '14px',
              color: '#666',
              margin: 0,
              lineHeight: 1.5
            }}>
              Key metrics and performance indicators at a glance
            </p>
          </div>

          {/* Stats Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '24px',
            marginBottom: '56px'
          }}>
            <div style={{ 
              padding: '28px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e8e8e8',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            >
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '16px'
              }}>
                <div>
                  <h3 style={{ 
                    margin: '0 0 8px 0',
                    color: '#666',
                    fontSize: '14px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Total Orders
                  </h3>
                  <p style={{ 
                    fontSize: '40px',
                    fontWeight: 700,
                    margin: 0,
                    color: '#1a1a1a'
                  }}>
                    {stats.totalOrders}
                  </p>
                </div>
                <div style={{
                  width: '56px',
                  height: '56px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px'
                }}>
                  📦
                </div>
              </div>
              <p style={{ fontSize: '14px', color: '#999', margin: 0 }}>
                All time orders received
              </p>
            </div>

            <div style={{ 
              padding: '28px',
              backgroundColor: '#fffbf0',
              borderRadius: '12px',
              border: '1px solid #ffc107',
              boxShadow: '0 2px 8px rgba(255, 193, 7, 0.1)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(255, 193, 7, 0.2)';
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(255, 193, 7, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            >
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '16px'
              }}>
                <div>
                  <h3 style={{ 
                    margin: '0 0 8px 0',
                    color: '#856404',
                    fontSize: '14px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Pending Orders
                  </h3>
                  <p style={{ 
                    fontSize: '40px',
                    fontWeight: 700,
                    margin: 0,
                    color: '#856404'
                  }}>
                    {stats.pendingOrders}
                  </p>
                </div>
                <div style={{
                  width: '56px',
                  height: '56px',
                  backgroundColor: '#fff3cd',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px'
                }}>
                  ⏰
                </div>
              </div>
              <p style={{ fontSize: '14px', color: '#856404', margin: 0 }}>
                Requires immediate attention
              </p>
            </div>

            <div style={{ 
              padding: '28px',
              backgroundColor: '#f0fdf4',
              borderRadius: '12px',
              border: '1px solid #86efac',
              boxShadow: '0 2px 8px rgba(134, 239, 172, 0.1)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(134, 239, 172, 0.2)';
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(134, 239, 172, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            >
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '16px'
              }}>
                <div>
                  <h3 style={{ 
                    margin: '0 0 8px 0',
                    color: '#166534',
                    fontSize: '14px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Total Products
                  </h3>
                  <p style={{ 
                    fontSize: '40px',
                    fontWeight: 700,
                    margin: 0,
                    color: '#166534'
                  }}>
                    {stats.totalProducts}
                  </p>
                </div>
                <div style={{
                  width: '56px',
                  height: '56px',
                  backgroundColor: '#dcfce7',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px'
                }}>
                  🏷️
                </div>
              </div>
              <p style={{ fontSize: '14px', color: '#166534', margin: 0 }}>
                Active in your catalog
              </p>
            </div>

            <div style={{ 
              padding: '28px',
              backgroundColor: '#fafafa',
              borderRadius: '12px',
              border: '1px solid #d4a574',
              boxShadow: '0 2px 8px rgba(212, 165, 116, 0.1)',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(212, 165, 116, 0.2)';
              e.currentTarget.style.transform = 'translateY(-4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(212, 165, 116, 0.1)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            >
              <div style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '16px'
              }}>
                <div>
                  <h3 style={{ 
                    margin: '0 0 8px 0',
                    color: '#92400e',
                    fontSize: '14px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Total Revenue
                  </h3>
                  <p style={{ 
                    fontSize: '40px',
                    fontWeight: 700,
                    margin: 0,
                    color: '#92400e'
                  }}>
                    ₹{stats.totalRevenue.toLocaleString()}
                  </p>
                </div>
                <div style={{
                  width: '56px',
                  height: '56px',
                  backgroundColor: '#fef3c7',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px'
                }}>
                  💰
                </div>
              </div>
              <p style={{ fontSize: '14px', color: '#92400e', margin: 0 }}>
                Total sales revenue
              </p>
            </div>
          </div>

          {/* Quick Actions Section */}
          <div style={{ marginBottom: '56px' }}>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ 
                fontSize: '22px',
                fontWeight: 600,
                color: '#1a1a1a',
                marginBottom: '8px',
                letterSpacing: '-0.02em'
              }}>
                ⚡ Quick Actions
              </h2>
              <p style={{ 
                fontSize: '14px',
                color: '#666',
                margin: 0,
                lineHeight: 1.5
              }}>
                Jump directly to common tasks and operations
              </p>
            </div>
            <div style={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '16px'
            }}>
              <a 
                href="/admin/orders/received" 
                style={{ 
                  padding: '20px 24px',
                  backgroundColor: '#1f2937',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s',
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#374151';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#1f2937';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                }}
              >
                <span style={{ fontSize: '20px' }}>📥</span>
                <span>Received Orders</span>
              </a>
              <a 
                href="/admin/orders/processing" 
                style={{ 
                  padding: '20px 24px',
                  backgroundColor: '#16a34a',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s',
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(22, 163, 74, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#15803d';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(22, 163, 74, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#16a34a';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(22, 163, 74, 0.2)';
                }}
              >
                <span style={{ fontSize: '20px' }}>⚙️</span>
                <span>Processing Orders</span>
              </a>
              <a 
                href="/admin/products" 
                style={{ 
                  padding: '20px 24px',
                  backgroundColor: '#0891b2',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s',
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(8, 145, 178, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#0e7490';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(8, 145, 178, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#0891b2';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(8, 145, 178, 0.2)';
                }}
              >
                <span style={{ fontSize: '20px' }}>📦</span>
                <span>Manage Products</span>
              </a>
              <a 
                href="/admin/settings" 
                style={{ 
                  padding: '20px 24px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '12px',
                  fontWeight: 600,
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s',
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(107, 114, 128, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#4b5563';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(107, 114, 128, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#6b7280';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(107, 114, 128, 0.2)';
                }}
              >
                <span style={{ fontSize: '20px' }}>⚙️</span>
                <span>Site Settings</span>
              </a>
            </div>
          </div>

          {/* Status Overview & Getting Started */}
          {stats.totalOrders === 0 && stats.totalProducts === 0 ? (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ 
                  fontSize: '22px',
                  fontWeight: 600,
                  color: '#1a1a1a',
                  marginBottom: '8px',
                  letterSpacing: '-0.02em'
                }}>
                  🚀 Getting Started
                </h2>
                <p style={{ 
                  fontSize: '14px',
                  color: '#666',
                  margin: 0,
                  lineHeight: 1.5
                }}>
                  Set up your store to start selling
                </p>
              </div>
              <div style={{
                padding: '60px 40px',
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '2px dashed #e8e8e8',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎯</div>
                <h3 style={{ 
                  fontSize: '28px',
                  fontWeight: 600,
                  color: '#1a1a1a',
                  marginBottom: '16px'
                }}>
                  Welcome to Your Store
                </h3>
                <p style={{ 
                  fontSize: '16px',
                  color: '#666',
                  marginBottom: '32px',
                  maxWidth: '600px',
                  margin: '0 auto 32px',
                  lineHeight: 1.7
                }}>
                  Your store is ready to go! Start by adding your first product to your catalog.
                  Then configure your store settings to customize the brand and homepage.
                  Once products are added, customers can browse and place orders.
                </p>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <a
                    href="/admin/products/new"
                    style={{
                      padding: '14px 32px',
                      backgroundColor: '#d4a574',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '15px',
                      transition: 'all 0.2s',
                      display: 'inline-block'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#c19565';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#d4a574';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    📦 Add First Product
                  </a>
                  <a
                    href="/admin/settings"
                    style={{
                      padding: '14px 32px',
                      backgroundColor: 'white',
                      color: '#1a1a1a',
                      textDecoration: 'none',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '15px',
                      border: '2px solid #e8e8e8',
                      transition: 'all 0.2s',
                      display: 'inline-block'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#d4a574';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e8e8e8';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    ⚙️ Configure Store
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ 
                  fontSize: '22px',
                  fontWeight: 600,
                  color: '#1a1a1a',
                  marginBottom: '8px',
                  letterSpacing: '-0.02em'
                }}>
                  💡 Tips & Guidance
                </h2>
                <p style={{ 
                  fontSize: '14px',
                  color: '#666',
                  margin: 0,
                  lineHeight: 1.5
                }}>
                  Helpful resources and best practices for managing your store
                </p>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '20px'
              }}>
                <div style={{
                  padding: '24px',
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e8e8e8'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>📦</div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#1a1a1a',
                    marginBottom: '8px'
                  }}>
                    Manage Inventory
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#666',
                    lineHeight: 1.6,
                    marginBottom: '16px'
                  }}>
                    Keep your product listings updated with accurate stock levels and pricing
                  </p>
                  <a
                    href="/admin/inventory"
                    style={{
                      fontSize: '14px',
                      color: '#d4a574',
                      fontWeight: 600,
                      textDecoration: 'none'
                    }}
                  >
                    View Stock →
                  </a>
                </div>
                <div style={{
                  padding: '24px',
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e8e8e8'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>📊</div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#1a1a1a',
                    marginBottom: '8px'
                  }}>
                    Track Performance
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#666',
                    lineHeight: 1.6,
                    marginBottom: '16px'
                  }}>
                    Monitor sales trends and customer behavior to make informed decisions
                  </p>
                  <a
                    href="/admin/analytics"
                    style={{
                      fontSize: '14px',
                      color: '#d4a574',
                      fontWeight: 600,
                      textDecoration: 'none'
                    }}
                  >
                    View Analytics →
                  </a>
                </div>
                <div style={{
                  padding: '24px',
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e8e8e8'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>🎨</div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#1a1a1a',
                    marginBottom: '8px'
                  }}>
                    Customize Store
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: '#666',
                    lineHeight: 1.6,
                    marginBottom: '16px'
                  }}>
                    Update homepage images and brand details to match your business identity
                  </p>
                  <a
                    href="/admin/settings"
                    style={{
                      fontSize: '14px',
                      color: '#d4a574',
                      fontWeight: 600,
                      textDecoration: 'none'
                    }}
                  >
                    Edit Settings →
                  </a>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
