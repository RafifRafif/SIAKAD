'use client';

import { CalendarDays, ClipboardList, Users, BellRing } from 'lucide-react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { StatCard } from '../../components/dashboard/StatCard';

const agendaKelas = [
  { waktu: '07:00', agenda: 'Pengecekan kehadiran kelas X-A', lokasi: 'Ruang X-A' },
  { waktu: '09:30', agenda: 'Koordinasi wali murid', lokasi: 'Ruang Guru' },
  { waktu: '12:30', agenda: 'Rekap presensi harian', lokasi: 'Dashboard Presensi' },
];

const pengumumanKelas = [
  { title: '2 siswa izin hari ini', detail: 'Perlu tindak lanjut wali kelas', tone: 'bg-amber-50 border-amber-200 text-amber-800' },
  { title: 'Absensi mingguan belum lengkap', detail: 'Lengkapi sebelum Jumat sore', tone: 'bg-blue-50 border-blue-200 text-blue-800' },
];

export default function GuruKelasDashboard() {
  const router = useRouter();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Dashboard Guru Kelas</h2>
        <p className="text-gray-600">
          Pantau kehadiran, kondisi kelas, dan tindak lanjut siswa setiap hari.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Siswa Kelas" value="32" color="bg-blue-100 text-blue-600" />
        <StatCard icon={ClipboardList} label="Presensi Hari Ini" value="30/32" color="bg-green-100 text-green-600" />
        <StatCard icon={CalendarDays} label="Kegiatan Minggu Ini" value="5" color="bg-purple-100 text-purple-600" />
        <StatCard icon={BellRing} label="Perlu Tindak Lanjut" value="2" color="bg-orange-100 text-orange-600" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h3 className="mb-6 text-lg font-semibold text-gray-900">Agenda Hari Ini</h3>
          <div className="space-y-4">
            {agendaKelas.map((item) => (
              <div key={item.agenda} className="rounded-lg border border-gray-200 p-4">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-semibold text-gray-900">{item.agenda}</span>
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-[#2563EB]">
                    {item.waktu}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{item.lokasi}</p>
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
          <h3 className="mb-6 text-lg font-semibold text-gray-900">Pengingat Kelas</h3>
          <div className="space-y-4">
            {pengumumanKelas.map((item) => (
              <div key={item.title} className={`rounded-lg border p-4 ${item.tone}`}>
                <div className="mb-1 font-semibold">{item.title}</div>
                <p className="text-sm">{item.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => void router.push('/guru-kelas/presensi')}
              className="rounded-lg bg-[#2563EB] py-3 font-medium text-white transition-all hover:bg-blue-700"
            >
              Monitoring Presensi
            </button>
            <button
              onClick={() => void router.push('/guru-kelas/nilai')}
              className="rounded-lg border border-gray-300 py-3 font-medium text-gray-700 transition-all hover:bg-gray-50"
            >
              Rekap Nilai
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
