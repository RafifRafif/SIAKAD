'use client';

import { useEffect, useState } from 'react';
import { BookOpen, FileText, GraduationCap, Clock3 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { StatCard } from '../../components/dashboard/StatCard';
import {
  emptyDashboardSummary,
  getGrades,
  getDashboardSummary,
  getLearningTasks,
  getTodaySchedule,
  type DashboardSummary,
  type LearningAssignmentItem,
  type LearningTaskItem,
  type StudentGradeItem,
} from '../../lib/academicActivityStore';

export default function GuruMapelDashboard() {
  const [assignments, setAssignments] = useState<LearningAssignmentItem[]>([]);
  const [summary, setSummary] = useState<DashboardSummary>(emptyDashboardSummary);
  const [tasks, setTasks] = useState<LearningTaskItem[]>([]);
  const [taskGrades, setTaskGrades] = useState<StudentGradeItem[]>([]);

  useEffect(() => {
    void Promise.all([
      getTodaySchedule(),
      getDashboardSummary(),
      getLearningTasks(),
      getGrades({ mine: '1', jenis: 'Tugas' }),
    ])
      .then(([assignmentItems, dashboardSummary, taskItems, gradeItems]) => {
        setAssignments(assignmentItems);
        setSummary(dashboardSummary);
        setTasks(taskItems);
        setTaskGrades(gradeItems);
      })
      .catch(() => {
        setAssignments([]);
        setSummary(emptyDashboardSummary);
        setTasks([]);
        setTaskGrades([]);
      });
  }, []);

  const uniqueClasses = new Set(assignments.map((item) => item.kelas)).size;
  const averageTaskGrade =
    taskGrades.length > 0
      ? (taskGrades.reduce((total, item) => total + Number(item.nilai), 0) / taskGrades.length).toFixed(2)
      : '0.00';

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-6 border-l-4 border-[#2563EB] p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#2563EB]">
              Dashboard Guru Mata Pelajaran
            </p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">Ruang Kerja Guru Mapel</h2>
            <p className="mt-2 max-w-2xl text-sm text-gray-600">
              Kelola jadwal mengajar, presensi, penilaian, dan progres pembelajaran per mata pelajaran.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:w-[360px]">
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
              <p className="text-xs font-medium text-blue-700">Kelas Diampu</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{uniqueClasses}</p>
            </div>
            <div className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3">
              <p className="text-xs font-medium text-amber-700">Rata-rata Tugas</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{averageTaskGrade}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={BookOpen} label="Mapel Diampu" value={String(assignments.length)} color="bg-blue-100 text-blue-600" />
        <StatCard icon={GraduationCap} label="Kelas Diampu" value={String(uniqueClasses)} color="bg-green-100 text-green-600" />
        <StatCard icon={Clock3} label="Presensi" value={String(summary.guru.presensi)} color="bg-purple-100 text-purple-600" />
        <StatCard icon={FileText} label="Input Nilai Akhir" value={String(summary.guru.inputNilai)} color="bg-orange-100 text-orange-600" />
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
              Input Nilai Akhir
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
              Rekap Presensi
            </Link>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Rekap Nilai Tugas</h3>
          <span className="text-sm font-medium text-gray-600">Rata-rata: {averageTaskGrade}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">NIS</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">Nama Siswa</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">Kelas</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">Mata Pelajaran</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">Nilai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {taskGrades.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-500">
                    Data nilai tugas akan tampil setelah tersedia di backend.
                  </td>
                </tr>
              ) : (
                taskGrades.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-700">{item.nis}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.nama}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.kelas}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{item.mapel}</td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-gray-900">{item.nilai}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
