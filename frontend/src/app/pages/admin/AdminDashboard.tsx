'use client';

import { useEffect, useMemo, useState } from 'react';
import { Users, GraduationCap, ClipboardCheck, TrendingUp } from 'lucide-react';
import dynamic from 'next/dynamic';
import { StatCard } from '../../components/dashboard/StatCard';
import { motion } from 'motion/react';
import {
  emptyDashboardSummary,
  formatDisplayDate,
  getDashboardSummary,
  type DashboardSummary,
} from '../../lib/academicActivityStore';

const AdminDashboardCharts = dynamic(() => import('./AdminDashboardCharts'), {
  ssr: false,
  loading: () => <ChartGridSkeleton />,
});

function ChartGridSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {[0, 1].map((item) => (
        <div
          key={item}
          className="h-[397px] animate-pulse rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-6 h-6 w-48 rounded bg-gray-200" />
          <div className="h-[300px] rounded-lg bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState<DashboardSummary>(emptyDashboardSummary);

  useEffect(() => {
    void getDashboardSummary()
      .then(setSummary)
      .catch(() => setSummary(emptyDashboardSummary));
  }, []);

  const recentActivities = useMemo(
    () => [
      ...summary.siswa.nilaiTerbaru.map((item) => ({
        time: formatDisplayDate(item.tanggal),
        action: `Nilai ${item.mapel} ${item.nama} tersimpan dari backend`,
      })),
      ...summary.siswa.presensiTerbaru.map((item) => ({
        time: formatDisplayDate(item.tanggal),
        action: `Presensi ${item.nama} tercatat ${item.status}`,
      })),
      ...summary.siswa.quranTerbaru.map((item) => ({
        time: formatDisplayDate(item.tanggal),
        action: `Setoran Qur'an ${item.nama} tercatat`,
      })),
    ],
    [summary]
  );

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
          label="Total Siswa"
          value={String(summary.admin.totalSiswa)}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          icon={GraduationCap}
          label="Total Guru"
          value={String(summary.admin.totalGuru)}
          color="bg-green-100 text-green-600"
        />
        <StatCard
          icon={ClipboardCheck}
          label="Presensi Hari Ini"
          value={summary.admin.presensiHariIni === null ? '0%' : `${summary.admin.presensiHariIni}%`}
          color="bg-purple-100 text-purple-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Rata-rata Nilai"
          value={summary.admin.rataRataNilai === null ? '0' : String(summary.admin.rataRataNilai)}
          color="bg-orange-100 text-orange-600"
        />
      </div>

      <AdminDashboardCharts />

      {/* Recent Activities */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Aktivitas Terbaru
        </h3>
        <div className="space-y-4">
          {recentActivities.map((activity, index) => (
            <div
              key={`${activity.action}-${index}`}
              className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-2 h-2 bg-[#2563EB] rounded-full mt-2" />
              <div className="flex-1">
                <p className="text-gray-900 text-sm">{activity.action}</p>
                <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
