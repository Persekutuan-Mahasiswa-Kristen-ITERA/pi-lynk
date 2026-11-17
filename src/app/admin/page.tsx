import { redirect } from 'next/navigation';
import { connection } from 'next/server';
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
  await connection(); // per-request: reads the PI-CORE session
  const auth = await verifyAdminSession();

  if (!auth.authorized) {
    redirect('/admin/login');
  }

  return <AdminDashboardClient adminEmail={auth.email} role={auth.role} />;
}
