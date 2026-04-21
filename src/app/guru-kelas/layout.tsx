import type { ReactNode } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';

export default function GuruKelasLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout role="guru-kelas">{children}</DashboardLayout>;
}
