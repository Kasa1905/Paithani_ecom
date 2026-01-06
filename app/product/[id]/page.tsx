import ProductDetail from '@/app/user/pages/ProductDetail';
import { UserLayout } from '@/app/shared/layouts/UserLayout';
import { ProtectedRoute } from '@/auth/ProtectedRoute';

export default function Page() {
  return (
    <UserLayout>
      <ProtectedRoute>
        <ProductDetail />
      </ProtectedRoute>
    </UserLayout>
  );
}
