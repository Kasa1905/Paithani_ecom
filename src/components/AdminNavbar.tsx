'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import styles from './AdminNavbar.module.css';

export default function AdminNavbar() {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className={styles.adminHeader}>
      <nav className={styles.adminNav}>
        <Link href="/admin" className={styles.brand}>
          <h1>Paithani Admin</h1>
        </Link>

        <ul className={styles.navList}>
          {/* Orders Section */}
          <li className={styles.navItem}>
            <Link href="/admin/orders?status=received" className={styles.navLink}>
              📥 Orders
            </Link>
            <ul className={styles.subMenu}>
              <li>
                <Link href="/admin/orders?status=received">Received</Link>
              </li>
              <li>
                <Link href="/admin/orders?status=confirmed">Confirmed</Link>
              </li>
              <li>
                <Link href="/admin/orders?status=packed">Packed</Link>
              </li>
              <li>
                <Link href="/admin/orders?status=shipped">Shipped</Link>
              </li>
              <li>
                <Link href="/admin/orders?status=delivered">Delivered</Link>
              </li>
            </ul>
          </li>

          {/* Products Section */}
          <li className={styles.navItem}>
            <Link href="/admin/products" className={styles.navLink}>
              📦 Products
            </Link>
            <ul className={styles.subMenu}>
              <li>
                <Link href="/admin/products">All Products</Link>
              </li>
              <li>
                <Link href="/admin/products/new">Add New</Link>
              </li>
              <li>
                <Link href="/admin/inventory">Stock Management</Link>
              </li>
            </ul>
          </li>

          {/* Settings */}
          <li className={styles.navItem}>
            <Link href="/admin/settings" className={styles.navLink}>
              ⚙️ Settings
            </Link>
          </li>

          {/* Analytics */}
          <li className={styles.navItem}>
            <Link href="/admin/analytics" className={styles.navLink}>
              📊 Analytics
            </Link>
          </li>

          {/* Logout */}
          <li className={styles.navItem}>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              🚪 Logout
            </button>
          </li>
        </ul>
      </nav>
    </header>
  );
}
