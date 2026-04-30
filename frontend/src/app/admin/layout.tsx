import type { ReactNode } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout role="admin">{children}</DashboardLayout>;
}
