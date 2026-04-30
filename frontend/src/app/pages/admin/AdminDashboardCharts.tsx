'use client';

import { motion } from 'motion/react';
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

export default function AdminDashboardCharts() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h3 className="mb-6 text-lg font-semibold text-gray-900">
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h3 className="mb-6 text-lg font-semibold text-gray-900">
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
  );
}
