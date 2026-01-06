import Collections from '@/app/user/pages/Collections';
import { UserLayout } from '@/app/shared/layouts/UserLayout';
import { ProtectedRoute } from '@/auth/ProtectedRoute';

export default function Page() {
  return (
    <UserLayout>
      <ProtectedRoute>
        <Collections />
      </ProtectedRoute>
    </UserLayout>
  );
}
