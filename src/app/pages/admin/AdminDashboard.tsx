'use client';

import { Users, GraduationCap, ClipboardCheck, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { StatCard } from '../../components/dashboard/StatCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { motion } from 'motion/react';

const attendanceData = [
  { name: 'Sen', hadir: 480, tidak: 20 },
  { name: 'Sel', hadir: 490, tidak: 10 },
  { name: 'Rab', hadir: 470, tidak: 30 },
  { name: 'Kam', hadir: 485, tidak: 15 },
  { name: 'Jum', hadir: 495, tidak: 5 },
];

const gradeData = [
  { bulan: 'Jan', rata: 82 },
  { bulan: 'Feb', rata: 85 },
  { bulan: 'Mar', rata: 83 },
  { bulan: 'Apr', rata: 87 },
  { bulan: 'Mei', rata: 89 },
  { bulan: 'Jun', rata: 91 },
];

export default function AdminDashboard() {
  const router = useRouter();

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Selamat Datang, Admin! 👋
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
          value="524"
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          icon={GraduationCap}
          label="Total Guru"
          value="48"
          color="bg-green-100 text-green-600"
        />
        <StatCard
          icon={ClipboardCheck}
          label="Presensi Hari Ini"
          value="98%"
          color="bg-purple-100 text-purple-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Rata-rata Nilai"
          value="87.5"
          color="bg-orange-100 text-orange-600"
        />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Attendance Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Grafik Presensi Minggu Ini
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="hadir" fill="#2563EB" name="Hadir" radius={[8, 8, 0, 0]} />
              <Bar dataKey="tidak" fill="#EF4444" name="Tidak Hadir" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Grade Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Trend Rata-rata Nilai
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={gradeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bulan" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="rata"
                stroke="#2563EB"
                strokeWidth={3}
                name="Rata-rata"
                dot={{ fill: '#2563EB', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Aksi Cepat
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => void router.push('/admin/siswa')}
            className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-xl hover:border-[#2563EB] hover:bg-blue-50 transition-all group"
          >
            <div className="w-12 h-12 bg-blue-100 text-[#2563EB] rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Users size={24} />
            </div>
            <span className="font-medium text-gray-900">Data Siswa</span>
          </button>
          <button
            onClick={() => void router.push('/admin/guru')}
            className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-xl hover:border-[#2563EB] hover:bg-blue-50 transition-all group"
          >
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <GraduationCap size={24} />
            </div>
            <span className="font-medium text-gray-900">Data Guru</span>
          </button>
          <button
            onClick={() => void router.push('/admin/kelas')}
            className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-xl hover:border-[#2563EB] hover:bg-blue-50 transition-all group"
          >
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <ClipboardCheck size={24} />
            </div>
            <span className="font-medium text-gray-900">Data Kelas</span>
          </button>
          <button
            onClick={() => void router.push('/admin/pelajaran')}
            className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-xl hover:border-[#2563EB] hover:bg-blue-50 transition-all group"
          >
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <TrendingUp size={24} />
            </div>
            <span className="font-medium text-gray-900">Data Pembelajaran</span>
          </button>
          <button
            onClick={() => void router.push('/admin/bobot-penilaian')}
            className="flex flex-col items-center justify-center p-6 border-2 border-gray-200 rounded-xl hover:border-[#2563EB] hover:bg-blue-50 transition-all group"
          >
            <div className="w-12 h-12 bg-yellow-100 text-yellow-700 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <TrendingUp size={24} />
            </div>
            <span className="font-medium text-gray-900">Bobot Penilaian</span>
          </button>
        </div>
      </motion.div>

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
          {[
            { time: '10 menit lalu', action: 'Guru Ustadzah Siti menambahkan nilai Matematika kelas XI-A' },
            { time: '25 menit lalu', action: 'Admin menambahkan 5 siswa baru ke sistem' },
            { time: '1 jam lalu', action: 'Presensi kelas X-B telah disubmit oleh Ustadz Ahmad' },
            { time: '2 jam lalu', action: 'Laporan bulanan bulan Maret telah dibuat' },
          ].map((activity, index) => (
            <div
              key={index}
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
