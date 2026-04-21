'use client';

import { BookOpen, Award, TrendingUp, Calendar } from 'lucide-react';
import { StatCard } from '../../components/dashboard/StatCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'motion/react';

const gradeData = [
  { bulan: 'Sep', rata: 82 },
  { bulan: 'Okt', rata: 85 },
  { bulan: 'Nov', rata: 83 },
  { bulan: 'Des', rata: 87 },
  { bulan: 'Jan', rata: 89 },
  { bulan: 'Feb', rata: 88 },
  { bulan: 'Mar', rata: 91 },
];

export default function SiswaDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Selamat Datang! 👋
        </h2>
        <p className="text-gray-600">Pantau perkembangan akademikmu di sini</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Award}
          label="Rata-rata Nilai"
          value="88.5"
          trend="2.5 poin naik"
          trendUp={true}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          icon={Calendar}
          label="Presensi Bulan Ini"
          value="98%"
          trend="Sangat Baik"
          trendUp={true}
          color="bg-green-100 text-green-600"
        />
        <StatCard
          icon={BookOpen}
          label="Progress Hafalan"
          value="7 Juz"
          color="bg-purple-100 text-purple-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Peringkat Kelas"
          value="5"
          trend="Dari 30 siswa"
          trendUp={true}
          color="bg-orange-100 text-orange-600"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Grafik Perkembangan Nilai
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={gradeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bulan" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="rata"
                stroke="#2563EB"
                strokeWidth={3}
                dot={{ fill: '#2563EB', r: 5 }}
                name="Rata-rata"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Jadwal Hari Ini</h3>
          <div className="space-y-4">
            {[
              { jam: '07:30', mapel: 'Matematika', guru: 'Ustadz Ahmad' },
              { jam: '09:15', mapel: 'Bahasa Inggris', guru: 'Ustadzah Siti' },
              { jam: '11:00', mapel: 'Fisika', guru: 'Ustadz Rizki' },
            ].map((jadwal, index) => (
              <div
                key={index}
                className="p-3 border border-gray-200 rounded-lg hover:border-[#2563EB] transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-900 text-sm">
                    {jadwal.mapel}
                  </span>
                  <span className="text-xs text-gray-500">{jadwal.jam}</span>
                </div>
                <p className="text-xs text-gray-600">{jadwal.guru}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Nilai Terbaru
          </h3>
          <div className="space-y-3">
            {[
              { mapel: 'Matematika', nilai: 92, jenis: 'UTS' },
              { mapel: 'Bahasa Inggris', nilai: 88, jenis: 'Quiz' },
              { mapel: 'Fisika', nilai: 85, jenis: 'Tugas' },
              { mapel: 'Kimia', nilai: 90, jenis: 'UTS' },
            ].map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <div>
                  <p className="font-semibold text-gray-900">{item.mapel}</p>
                  <p className="text-xs text-gray-600">{item.jenis}</p>
                </div>
                <span
                  className={`px-4 py-2 rounded-lg font-bold ${
                    item.nilai >= 90
                      ? 'bg-green-100 text-green-700'
                      : item.nilai >= 80
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {item.nilai}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-[#2563EB] to-blue-600 rounded-xl p-6 text-white shadow-lg"
        >
          <h3 className="text-lg font-semibold mb-4">Progress Hafalan Al-Qur'an</h3>
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span>Progress Hafalan</span>
              <span className="font-bold">7 / 30 Juz</span>
            </div>
            <div className="w-full bg-white/30 rounded-full h-3">
              <div
                className="bg-white h-3 rounded-full transition-all"
                style={{ width: '23.3%' }}
              />
            </div>
            <p className="text-xs text-blue-100 mt-2">23.3% selesai</p>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Surah Terakhir:</span>
              <span className="font-medium">Al-Baqarah</span>
            </div>
            <div className="flex justify-between">
              <span>Ayat Terakhir:</span>
              <span className="font-medium">Ayat 150</span>
            </div>
            <div className="flex justify-between">
              <span>Penilaian:</span>
              <span className="px-2 py-1 bg-white/20 rounded-full font-medium text-xs">
                Lancar
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
