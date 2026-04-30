'use client';

import { motion } from 'motion/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

const monthlyData = [
  { bulan: 'Jan', hadir: 95, tidak: 5 },
  { bulan: 'Feb', hadir: 93, tidak: 7 },
  { bulan: 'Mar', hadir: 96, tidak: 4 },
  { bulan: 'Apr', hadir: 94, tidak: 6 },
  { bulan: 'Mei', hadir: 97, tidak: 3 },
  { bulan: 'Jun', hadir: 98, tidak: 2 },
];

const gradeData = [
  { kelas: 'X-A', rata: 85 },
  { kelas: 'X-B', rata: 83 },
  { kelas: 'XI-A', rata: 87 },
  { kelas: 'XI-B', rata: 86 },
  { kelas: 'XII-A', rata: 90 },
  { kelas: 'XII-B', rata: 88 },
];

export default function LaporanAdminCharts() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h3 className="mb-6 text-lg font-semibold text-gray-900">
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
        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h3 className="mb-6 text-lg font-semibold text-gray-900">
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
  );
}
