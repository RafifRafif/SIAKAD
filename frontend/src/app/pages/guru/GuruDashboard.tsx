'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BellRing,
  BookOpen,
  CalendarDays,
  ClipboardList,
  Clock3,
  GraduationCap,
  Users,
} from 'lucide-react';
import { motion } from 'motion/react';
import { StatCard } from '../../components/dashboard/StatCard';
import { getAuthSession, getCurrentGuruAccess, type GuruAccess } from '../../lib/authStore';
import {
  emptyDashboardSummary,
  getDashboardSummary,
  getLearningTasks,
  getTodaySchedule,
  type DashboardSummary,
  type LearningAssignmentItem,
  type LearningTaskItem,
} from '../../lib/academicActivityStore';

export default function GuruDashboard() {
  const [guruAccess, setGuruAccess] = useState<GuruAccess[]>([]);
  const [displayName, setDisplayName] = useState('Ustadz/Ustadzah');
  const [isReady, setIsReady] = useState(false);
  const [summary, setSummary] = useState<DashboardSummary>(emptyDashboardSummary);
  const [assignments, setAssignments] = useState<LearningAssignmentItem[]>([]);
  const [tasks, setTasks] = useState<LearningTaskItem[]>([]);

  useEffect(() => {
    const loadSession = async () => {
      const [access, session, dashboardSummary, assignmentItems, taskItems] = await Promise.all([
        getCurrentGuruAccess(),
        getAuthSession(),
        getDashboardSummary(),
        getTodaySchedule(),
        getLearningTasks(),
      ]);

      setGuruAccess(access);
      setSummary(dashboardSummary);
      setAssignments(assignmentItems);
      setTasks(taskItems);

      if (session?.role === 'guru') {
        setDisplayName(session.displayName);
      }

      setIsReady(true);
    };

    void loadSession().catch(() => setIsReady(true));
  }, []);

  const hasWaliKelas = guruAccess.includes('Wali Kelas');
  const hasGuruMapel = guruAccess.includes('Guru Mapel');

  if (!isReady) {
    return (
      <div className="space-y-8">
        <div>
          <div className="h-8 w-72 animate-pulse rounded bg-gray-200" />
          <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded bg-gray-100" />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-28 animate-pulse rounded-xl border border-gray-200 bg-white" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-2 text-2xl font-bold text-gray-900">
          Selamat Datang, {displayName}
        </h2>
        <p className="text-gray-600">
          Fitur yang tampil mengikuti akses yang diberikan admin pada data guru.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {hasWaliKelas && (
          <>
            <StatCard icon={Users} label="Siswa Wali Kelas" value={String(summary.admin.totalSiswa)} color="bg-blue-100 text-blue-600" />
            <StatCard icon={ClipboardList} label="Presensi Hari Ini" value={String(summary.guru.presensi)} color="bg-green-100 text-green-600" />
          </>
        )}
        {hasGuruMapel && (
          <>
            <StatCard icon={BookOpen} label="Mapel Diampu" value={String(assignments.length)} color="bg-indigo-100 text-indigo-600" />
            <StatCard icon={Clock3} label="Input Nilai" value={String(summary.guru.inputNilai)} color="bg-orange-100 text-orange-600" />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {hasGuruMapel && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Ruang Guru Mapel</h3>
                <p className="mt-1 text-sm text-gray-600">Kelola presensi, penilaian, dan jadwal mengajar.</p>
              </div>
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
                Guru Mapel
              </span>
            </div>

            <div className="space-y-4">
              {assignments.slice(0, 3).map((item) => (
                <div key={item.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <span className="font-semibold text-gray-900">{item.nama}</span>
                    <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
                      {item.kelas}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{item.guruPengampu}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Link
                href="/guru/presensi"
                className="flex items-center justify-center rounded-lg bg-[#2563EB] px-3 py-3 text-center text-sm font-medium text-white transition-all hover:bg-blue-700"
              >
                Presensi Kelas
              </Link>
              <Link
                href="/guru/nilai"
                className="flex items-center justify-center rounded-lg border border-gray-300 px-3 py-3 text-center text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
              >
                Input Nilai
              </Link>
              <Link
                href="/guru/rekap-absensi"
                className="flex items-center justify-center rounded-lg border border-gray-300 px-3 py-3 text-center text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
              >
                Rekap Absensi
              </Link>
            </div>
          </motion.div>
        )}
      </div>
      {!hasWaliKelas && !hasGuruMapel && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <GraduationCap size={36} className="mx-auto text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">Belum ada akses guru</h3>
          <p className="mt-2 text-sm text-gray-600">
            Admin perlu memberikan akses Wali Kelas atau Guru Mapel di menu Data Guru.
          </p>
        </div>
      )}
    </div>
  );
}
