import type { ReactNode } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';

export default function SiswaLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout role="siswa">{children}</DashboardLayout>;
}
