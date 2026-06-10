'use client';

import { useEffect, useState } from 'react';
import { Users, GraduationCap, School, BookOpen } from 'lucide-react';
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
      {/* Welcome Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Selamat Datang, Admin!
        </h2>
        <p className="text-gray-600">
          Berikut adalah ringkasan sistem informasi akademik hari ini
        </p>
      </div>

      {/* Stats Grid */}
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
