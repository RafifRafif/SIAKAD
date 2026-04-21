import type { ReactNode } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';

export default function GuruMapelLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout role="guru-mapel">{children}</DashboardLayout>;
}
