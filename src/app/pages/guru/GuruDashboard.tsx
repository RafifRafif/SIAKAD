'use client';

import { Calendar, Clock, BookOpen, FileText } from 'lucide-react';
import { StatCard } from '../../components/dashboard/StatCard';
import { motion } from 'motion/react';

const jadwalHariIni = [
  { waktu: '07:30 - 09:00', kelas: 'X-A', mataPelajaran: 'Matematika', ruang: 'R.101' },
  { waktu: '09:15 - 10:45', kelas: 'XI-B', mataPelajaran: 'Matematika', ruang: 'R.102' },
  { waktu: '11:00 - 12:30', kelas: 'XII-A', mataPelajaran: 'Matematika', ruang: 'R.101' },
];

const tugasMenunggu = [
  { kelas: 'X-A', tugas: 'Input nilai UTS Matematika', deadline: '2 hari lagi' },
  { kelas: 'XI-B', tugas: 'Presensi minggu ini', deadline: 'Besok' },
];

export default function GuruDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Selamat Datang, Ustadz/Ustadzah! 👋
        </h2>
        <p className="text-gray-600">Berikut adalah ringkasan jadwal dan tugas Anda hari ini</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Calendar}
          label="Jadwal Mengajar Hari Ini"
          value="3"
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          icon={Clock}
          label="Jam Mengajar Minggu Ini"
          value="24"
          color="bg-green-100 text-green-600"
        />
        <StatCard
          icon={BookOpen}
          label="Kelas yang Diampu"
          value="6"
          color="bg-purple-100 text-purple-600"
        />
        <StatCard
          icon={FileText}
          label="Tugas Menunggu"
          value="2"
          color="bg-orange-100 text-orange-600"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Jadwal Mengajar Hari Ini</h3>
          <div className="space-y-4">
            {jadwalHariIni.map((jadwal, index) => (
              <div
                key={index}
                className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:border-[#2563EB] transition-colors"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock size={24} className="text-[#2563EB]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-900">{jadwal.mataPelajaran}</span>
                    <span className="px-3 py-1 bg-blue-100 text-[#2563EB] rounded-full text-xs font-medium">
                      {jadwal.kelas}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{jadwal.waktu}</p>
                  <p className="text-xs text-gray-500 mt-1">Ruang: {jadwal.ruang}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Tugas Menunggu</h3>
          <div className="space-y-4">
            {tugasMenunggu.map((tugas, index) => (
              <div
                key={index}
                className="p-4 border border-orange-200 bg-orange-50 rounded-lg"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="font-semibold text-gray-900">{tugas.tugas}</span>
                  <span className="px-3 py-1 bg-orange-200 text-orange-800 rounded-full text-xs font-medium">
                    {tugas.deadline}
                  </span>
                </div>
                <p className="text-sm text-gray-600">Kelas: {tugas.kelas}</p>
              </div>
            ))}
          </div>

          <button className="w-full mt-6 bg-[#2563EB] text-white py-3 rounded-lg hover:bg-blue-700 transition-all font-medium">
            Lihat Semua Tugas
          </button>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-r from-[#2563EB] to-blue-600 rounded-xl p-8 text-white"
      >
        <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <button className="bg-white/20 backdrop-blur-sm py-4 rounded-lg hover:bg-white/30 transition-all font-medium">
            📋 Input Presensi
          </button>
          <button className="bg-white/20 backdrop-blur-sm py-4 rounded-lg hover:bg-white/30 transition-all font-medium">
            📝 Input Nilai
          </button>
          <button className="bg-white/20 backdrop-blur-sm py-4 rounded-lg hover:bg-white/30 transition-all font-medium">
            📖 Setoran Al-Qur'an
          </button>
        </div>
      </motion.div>
    </div>
  );
}
