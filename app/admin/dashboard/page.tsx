import Dashboard from '@/app/admin/pages/Dashboard';
import { AdminLayout } from '@/app/shared/layouts/AdminLayout';
import { AdminRoute } from '@/auth/AdminRoute';

export default function Page() {
  return (
    <AdminLayout>
      <AdminRoute>
        <Dashboard />
      </AdminRoute>
    </AdminLayout>
  );
}
