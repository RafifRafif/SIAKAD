'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

import { motion } from 'motion/react';
import { Download, FileText, Calendar } from 'lucide-react';

const monthlyData = [
  { bulan: 'Jan', hadir: 95, tidak: 5 },
  { bulan: 'Feb', hadir: 93, tidak: 7 },
  { bulan: 'Mar', hadir: 96, tidak: 4 },
  { bulan: 'Apr', hadir: 94, tidak: 6 },
  { bulan: 'Mei', hadir: 97, tidak: 3 },
  { bulan: 'Jun', halan: 98, tidak: 2 },
];

const gradeData = [
  { kelas: 'X-A', rata: 85 },
  { kelas: 'X-B', rata: 83 },
  { kelas: 'XI-A', rata: 87 },
  { kelas: 'XI-B', rata: 86 },
  { kelas: 'XII-A', rata: 90 },
  { kelas: 'XII-B', rata: 88 },
];

export default function LaporanAdmin() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Laporan Akademik</h2>
          <p className="text-gray-600 mt-1">Rekap dan analisis data akademik</p>
        </div>
        <button className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-all font-medium shadow-md">
          <Download size={20} />
          <span>Export PDF</span>
        </button>
      </div>

      {/* Filter Period */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Periode
            </label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] outline-none">
              <option>Bulanan</option>
              <option>Semester</option>
              <option>Tahunan</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bulan
            </label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] outline-none">
              <option>Maret 2026</option>
              <option>Februari 2026</option>
              <option>Januari 2026</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kelas
            </label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] outline-none">
              <option>Semua Kelas</option>
              <option>Kelas X</option>
              <option>Kelas XI</option>
              <option>Kelas XII</option>
            </select>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Rekap Presensi Bulanan (%)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bulan" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="hadir" stroke="#10B981" strokeWidth={3} name="Hadir" />
              <Line type="monotone" dataKey="tidak" stroke="#EF4444" strokeWidth={3} name="Tidak Hadir" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Rata-rata Nilai Per Kelas
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={gradeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="kelas" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="rata" fill="#2563EB" name="Rata-rata" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Calendar size={24} className="text-[#2563EB]" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Hari Efektif</p>
              <p className="text-2xl font-bold text-gray-900">248</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <FileText size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Rata-rata Kehadiran</p>
              <p className="text-2xl font-bold text-gray-900">96.2%</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <FileText size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Rata-rata Nilai Keseluruhan</p>
              <p className="text-2xl font-bold text-gray-900">86.5</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
