import Orders from '@/app/admin/pages/Orders';
import { AdminLayout } from '@/app/shared/layouts/AdminLayout';
import { AdminRoute } from '@/auth/AdminRoute';

export default function Page() {
  return (
    <AdminLayout>
      <AdminRoute>
        <Orders />
      </AdminRoute>
    </AdminLayout>
  );
}
