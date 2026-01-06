import Cart from '@/app/user/pages/Cart';
import { UserLayout } from '@/app/shared/layouts/UserLayout';
import { ProtectedRoute } from '@/auth/ProtectedRoute';

export default function Page() {
  return (
    <UserLayout>
      <ProtectedRoute>
        <Cart />
      </ProtectedRoute>
    </UserLayout>
  );
}
