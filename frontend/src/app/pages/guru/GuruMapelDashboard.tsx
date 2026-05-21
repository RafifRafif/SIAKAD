'use client';

import { useEffect, useState } from 'react';
import { BookOpen, FileText, GraduationCap, Clock3 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { StatCard } from '../../components/dashboard/StatCard';
import {
  emptyDashboardSummary,
  getDashboardSummary,
  getLearningTasks,
  getTodaySchedule,
  type DashboardSummary,
  type LearningAssignmentItem,
  type LearningTaskItem,
} from '../../lib/academicActivityStore';

export default function GuruMapelDashboard() {
  const [assignments, setAssignments] = useState<LearningAssignmentItem[]>([]);
  const [summary, setSummary] = useState<DashboardSummary>(emptyDashboardSummary);
  const [tasks, setTasks] = useState<LearningTaskItem[]>([]);

  useEffect(() => {
    void Promise.all([
      getTodaySchedule(),
      getDashboardSummary(),
      getLearningTasks(),
    ])
      .then(([assignmentItems, dashboardSummary, taskItems]) => {
        setAssignments(assignmentItems);
        setSummary(dashboardSummary);
        setTasks(taskItems);
      })
      .catch(() => {
        setAssignments([]);
        setSummary(emptyDashboardSummary);
        setTasks([]);
      });
  }, []);

  const uniqueClasses = new Set(assignments.map((item) => item.kelas)).size;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Dashboard Guru Mata Pelajaran</h2>
        <p className="text-gray-600">
          Kelola jadwal mengajar, penilaian, dan progres pembelajaran per mata pelajaran.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={BookOpen} label="Mapel Diampu" value={String(assignments.length)} color="bg-blue-100 text-blue-600" />
        <StatCard icon={GraduationCap} label="Kelas Diampu" value={String(uniqueClasses)} color="bg-green-100 text-green-600" />
        <StatCard icon={Clock3} label="Presensi" value={String(summary.guru.presensi)} color="bg-purple-100 text-purple-600" />
        <StatCard icon={FileText} label="Input Nilai" value={String(summary.guru.inputNilai)} color="bg-orange-100 text-orange-600" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h3 className="mb-6 text-lg font-semibold text-gray-900">Jadwal Mengajar Hari Ini</h3>
          <div className="space-y-4">
            {assignments.slice(0, 3).map((item) => (
              <div key={item.id} className="rounded-lg border border-gray-200 p-4">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-semibold text-gray-900">{item.nama}</span>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-[#2563EB]">
                    {item.kelas}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{item.guruPengampu}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h3 className="mb-6 text-lg font-semibold text-gray-900">Tugas Pembelajaran</h3>
          <p className="text-sm text-gray-600">
            {tasks[0]?.judul ?? 'Data tugas pembelajaran akan tampil setelah tersedia di backend.'}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              href="/guru-mapel/nilai"
              className="flex items-center justify-center rounded-lg bg-[#2563EB] py-3 text-center font-medium text-white transition-all hover:bg-blue-700"
            >
              Input Nilai
            </Link>
            <Link
              href="/guru-mapel/presensi"
              className="flex items-center justify-center rounded-lg border border-gray-300 py-3 text-center font-medium text-gray-700 transition-all hover:bg-gray-50"
            >
              Presensi Kelas
            </Link>
            <Link
              href="/guru-mapel/rekap-absensi"
              className="flex items-center justify-center rounded-lg border border-gray-300 py-3 text-center font-medium text-gray-700 transition-all hover:bg-gray-50 sm:col-span-2"
            >
              Rekap Absensi
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
