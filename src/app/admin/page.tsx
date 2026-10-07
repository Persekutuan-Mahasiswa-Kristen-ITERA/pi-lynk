import { redirect } from 'next/navigation';
import { verifyAdminSession } from '@/auth';
import AdminDashboardClient from '@/components/admin-dashboard';

export const metadata = {
  title: 'Dashboard Admin | PI-LYNK',
  robots: {
    index: false,
    follow: false,
  },
};

export const instant = false;

export default async function AdminPage() {
  const auth = await verifyAdminSession();

  if (!auth.authorized) {
    redirect('/admin/login');
  }

  return <AdminDashboardClient adminEmail={auth.email || 'Admin'} />;
}
