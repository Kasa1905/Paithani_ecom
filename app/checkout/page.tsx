import Checkout from '@/app/user/pages/Checkout';
import { UserLayout } from '@/app/shared/layouts/UserLayout';
import { ProtectedRoute } from '@/auth/ProtectedRoute';

export default function Page() {
  return (
    <UserLayout>
      <ProtectedRoute>
        <Checkout />
      </ProtectedRoute>
    </UserLayout>
  );
}
