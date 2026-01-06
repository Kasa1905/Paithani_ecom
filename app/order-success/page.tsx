import OrderSuccess from '@/app/user/pages/OrderSuccess';
import { UserLayout } from '@/app/shared/layouts/UserLayout';
import { ProtectedRoute } from '@/auth/ProtectedRoute';

export default function Page() {
  return (
    <UserLayout>
      <ProtectedRoute>
        <OrderSuccess />
      </ProtectedRoute>
    </UserLayout>
  );
}
