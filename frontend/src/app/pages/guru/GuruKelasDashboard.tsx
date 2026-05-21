'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, ClipboardList, Users, BellRing } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { StatCard } from '../../components/dashboard/StatCard';
import {
  getClassDashboard,
  emptyDashboardSummary,
  getDashboardSummary,
  type ClassDashboardData,
  type DashboardSummary,
} from '../../lib/academicActivityStore';

export default function GuruKelasDashboard() {
  const [summary, setSummary] = useState<DashboardSummary>(emptyDashboardSummary);
  const [classDashboard, setClassDashboard] = useState<ClassDashboardData>({
    kelas: null,
    totalStudents: 0,
    attendanceToday: 0,
    agendaToday: [],
    reminders: [],
    weeklyActivities: 0,
    followUps: 0,
  });

  useEffect(() => {
    void Promise.all([getDashboardSummary(), getClassDashboard()])
      .then(([dashboardSummary, classData]) => {
        setSummary(dashboardSummary);
        setClassDashboard(classData);
      })
      .catch(() => {
        setSummary(emptyDashboardSummary);
        setClassDashboard({
          kelas: null,
          totalStudents: 0,
          attendanceToday: 0,
          agendaToday: [],
          reminders: [],
          weeklyActivities: 0,
          followUps: 0,
        });
      });
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Dashboard Guru Kelas</h2>
        <p className="text-gray-600">
          Pantau kehadiran, kondisi kelas, dan tindak lanjut siswa setiap hari.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Siswa Kelas" value={String(classDashboard.totalStudents ?? summary.admin.totalSiswa)} color="bg-blue-100 text-blue-600" />
        <StatCard icon={ClipboardList} label="Presensi Hari Ini" value={String(classDashboard.attendanceToday ?? summary.guru.presensi)} color="bg-green-100 text-green-600" />
        <StatCard icon={CalendarDays} label="Kegiatan Minggu Ini" value={String(classDashboard.weeklyActivities)} color="bg-purple-100 text-purple-600" />
        <StatCard icon={BellRing} label="Perlu Tindak Lanjut" value={String(classDashboard.followUps)} color="bg-orange-100 text-orange-600" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h3 className="mb-6 text-lg font-semibold text-gray-900">Agenda Hari Ini</h3>
          <p className="text-sm text-gray-600">
            {classDashboard.agendaToday[0]?.judul ?? 'Data agenda kelas akan tampil setelah tersedia di backend.'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h3 className="mb-6 text-lg font-semibold text-gray-900">Pengingat Kelas</h3>
          <p className="text-sm text-gray-600">
            {classDashboard.reminders[0]?.judul ?? 'Data pengingat kelas akan tampil setelah tersedia di backend.'}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              href="/guru-kelas/presensi"
              className="flex items-center justify-center rounded-lg bg-[#2563EB] py-3 text-center font-medium text-white transition-all hover:bg-blue-700"
            >
              Monitoring Presensi
            </Link>
            <Link
              href="/guru-kelas/nilai"
              className="flex items-center justify-center rounded-lg border border-gray-300 py-3 text-center font-medium text-gray-700 transition-all hover:bg-gray-50"
            >
              Rekap Nilai
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
