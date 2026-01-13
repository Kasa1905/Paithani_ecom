'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <header>
      <nav>
        <Link href="/">
          <h1>Paithani E-Commerce</h1>
        </Link>
        <ul>
          {user?.role !== 'admin' && (
            <>
              <li>
                <Link href="/products">Products</Link>
              </li>
              <li>
                <Link href="/cart">Cart ({cartCount})</Link>
              </li>
            </>
          )}
          {isAuthenticated ? (
            <>
              {user?.role !== 'admin' && (
                <li>
                  <Link href="/orders">Orders</Link>
                </li>
              )}
              {user?.role === 'admin' && (
                <li>
                  <Link href="/admin/orders">Admin</Link>
                </li>
              )}
              <li>
                <button onClick={handleLogout}>Logout</button>
              </li>
            </>
          ) : (
            <li>
              <Link href="/login">Login</Link>
            </li>
          )}
        </ul>
      </nav>
    </header>
  );
}
