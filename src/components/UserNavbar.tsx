'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import styles from './UserNavbar.module.css';

export default function UserNavbar() {
  const { isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className={styles.userHeader}>
      <nav className={styles.userNav}>
        <Link href="/" className={styles.brand}>
          <h1>Paithani Sarees</h1>
        </Link>

        <ul className={styles.navList}>
          <li className={styles.navItem}>
            <Link href="/" className={styles.navLink}>
              🏠 Home
            </Link>
          </li>

          <li className={styles.navItem}>
            <Link href="/products" className={styles.navLink}>
              📦 Shop
            </Link>
          </li>

          <li className={styles.navItem}>
            <Link href="/cart" className={styles.navLink}>
              🛒 Cart
              {cartCount > 0 && (
                <span className={styles.badge}>{cartCount}</span>
              )}
            </Link>
          </li>

          {isAuthenticated ? (
            <>
              <li className={styles.navItem}>
                <Link href="/orders" className={styles.navLink}>
                  📋 Orders
                </Link>
              </li>

              <li className={styles.navItem}>
                <Link href="/dashboard" className={styles.navLink}>
                  👤 Profile
                </Link>
              </li>

              <li className={styles.navItem}>
                <button onClick={handleLogout} className={styles.logoutBtn}>
                  🚪 Logout
                </button>
              </li>
            </>
          ) : (
            <li className={styles.navItem}>
              <Link href="/login" className={styles.loginBtn}>
                🔑 Login
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
}

