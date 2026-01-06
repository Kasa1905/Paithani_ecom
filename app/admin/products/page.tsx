import Products from '@/app/admin/pages/Products';
import { AdminLayout } from '@/app/shared/layouts/AdminLayout';
import { AdminRoute } from '@/auth/AdminRoute';

export default function Page() {
  return (
    <AdminLayout>
      <AdminRoute>
        <Products />
      </AdminRoute>
    </AdminLayout>
  );
}
