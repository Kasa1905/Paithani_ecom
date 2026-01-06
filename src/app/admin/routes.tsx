import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Orders from './pages/Orders';

// Admin routes configuration
export const adminRoutes = [
  { path: '/admin/login', component: AdminLogin, protected: false },
  { path: '/admin/dashboard', component: Dashboard, protected: true },
  { path: '/admin/products', component: Products, protected: true },
  { path: '/admin/orders', component: Orders, protected: true },
];
