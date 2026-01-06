import AdminLogin from '@/app/admin/pages/AdminLogin';
import { AdminLayout } from '@/app/shared/layouts/AdminLayout';

export default function Page() {
  return (
    <AdminLayout>
      <AdminLogin />
    </AdminLayout>
  );
}
