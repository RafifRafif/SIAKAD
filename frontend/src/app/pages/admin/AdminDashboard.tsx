'use client';

import { useEffect, useState } from 'react';
import { BookOpen, CalendarDays, GraduationCap, School, Users } from 'lucide-react';
import { StatCard } from '../../components/dashboard/StatCard';
import { apiGet } from '../../lib/apiClient';
import {
  emptyDashboardSummary,
  getDashboardSummary,
  type DashboardSummary,
} from '../../lib/academicActivityStore';
import type { KelasItem } from '../../lib/kelasStore';
import type { MasterPelajaran } from '../../lib/pelajaranStore';

export default function AdminDashboard() {
  const [summary, setSummary] = useState<DashboardSummary>(emptyDashboardSummary);
  const [totalKelas, setTotalKelas] = useState(0);
  const [totalPelajaran, setTotalPelajaran] = useState(0);

  useEffect(() => {
    void Promise.all([
      getDashboardSummary(),
      apiGet<KelasItem[]>('/api/school-classes'),
      apiGet<MasterPelajaran[]>('/api/subjects'),
    ])
      .then(([summaryData, kelasItems, pelajaranItems]) => {
        setSummary(summaryData);
        setTotalKelas(kelasItems.length);
        setTotalPelajaran(pelajaranItems.length);
      })
      .catch(() => {
        setSummary(emptyDashboardSummary);
        setTotalKelas(0);
        setTotalPelajaran(0);
      });
  }, []);

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-6 border-l-4 border-[#2563EB] p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#2563EB]">
              Dashboard Admin
            </p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              Selamat Datang, Admin!
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-gray-600">
              Kelola data akademik, kelas, guru, siswa, dan pembelajaran dalam satu pusat kendali.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:w-[360px]">
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-medium text-blue-700">
                <CalendarDays size={15} />
                <span>Ringkasan Hari Ini</span>
              </div>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {summary.admin.totalSiswa + summary.admin.totalGuru}
              </p>
              <p className="text-xs text-gray-600">Total warga sekolah terdata</p>
            </div>
            <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3">
              <p className="text-xs font-medium text-emerald-700">Master Akademik</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {totalKelas + totalPelajaran}
              </p>
              <p className="text-xs text-gray-600">Kelas dan pelajaran aktif</p>
            </div>
          </div>
      </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          label="Data Siswa"
          value={String(summary.admin.totalSiswa)}
          color="bg-blue-100 text-blue-600"
          detailHref="/admin/siswa"
        />
        <StatCard
          icon={GraduationCap}
          label="Data Guru"
          value={String(summary.admin.totalGuru)}
          color="bg-green-100 text-green-600"
          detailHref="/admin/guru"
        />
        <StatCard
          icon={School}
          label="Data Kelas"
          value={String(totalKelas)}
          color="bg-purple-100 text-purple-600"
          detailHref="/admin/kelas"
        />
        <StatCard
          icon={BookOpen}
          label="Data Pelajaran"
          value={String(totalPelajaran)}
          color="bg-orange-100 text-orange-600"
          detailHref="/admin/pelajaran"
        />
      </div>

    </div>
  );
}
