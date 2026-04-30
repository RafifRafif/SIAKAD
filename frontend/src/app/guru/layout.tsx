import type { ReactNode } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';

export default function GuruLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout role="guru">{children}</DashboardLayout>;
}
