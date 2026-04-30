'use client';

import { BookOpen, FileText, GraduationCap, Clock3 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { StatCard } from '../../components/dashboard/StatCard';

const jadwalMapel = [
  { waktu: '07:30 - 09:00', kelas: 'X-A', mapel: 'Matematika' },
  { waktu: '09:15 - 10:45', kelas: 'XI-B', mapel: 'Matematika' },
  { waktu: '13:00 - 14:30', kelas: 'XII-A', mapel: 'Matematika' },
];

const tugasMapel = [
  { title: 'Input nilai formatif kelas X-A', deadline: 'Hari ini', tone: 'bg-red-50 border-red-200 text-red-700' },
  { title: 'Review hasil ulangan XI-B', deadline: 'Besok', tone: 'bg-blue-50 border-blue-200 text-blue-700' },
];

export default function GuruMapelDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Dashboard Guru Mata Pelajaran</h2>
        <p className="text-gray-600">
          Kelola jadwal mengajar, penilaian, dan progres pembelajaran per mata pelajaran.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={BookOpen} label="Mapel Diampu" value="2" color="bg-blue-100 text-blue-600" />
        <StatCard icon={GraduationCap} label="Kelas Diampu" value="6" color="bg-green-100 text-green-600" />
        <StatCard icon={Clock3} label="Jam Mengajar" value="24" color="bg-purple-100 text-purple-600" />
        <StatCard icon={FileText} label="Penilaian Pending" value="2" color="bg-orange-100 text-orange-600" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h3 className="mb-6 text-lg font-semibold text-gray-900">Jadwal Mengajar Hari Ini</h3>
          <div className="space-y-4">
            {jadwalMapel.map((item) => (
              <div key={`${item.kelas}-${item.waktu}`} className="rounded-lg border border-gray-200 p-4">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-semibold text-gray-900">{item.mapel}</span>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-[#2563EB]">
                    {item.kelas}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{item.waktu}</p>
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
          <div className="space-y-4">
            {tugasMapel.map((item) => (
              <div key={item.title} className={`rounded-lg border p-4 ${item.tone}`}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-semibold">{item.title}</span>
                  <span className="text-xs font-medium">{item.deadline}</span>
                </div>
              </div>
            ))}
          </div>

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
