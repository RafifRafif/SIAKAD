'use client';

import { motion } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const gradeData = [
  { bulan: 'Sep', rata: 82 },
  { bulan: 'Okt', rata: 85 },
  { bulan: 'Nov', rata: 83 },
  { bulan: 'Des', rata: 87 },
  { bulan: 'Jan', rata: 89 },
  { bulan: 'Feb', rata: 88 },
  { bulan: 'Mar', rata: 91 },
];

export default function SiswaGradeChart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2"
    >
      <h3 className="mb-6 text-lg font-semibold text-gray-900">
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
  );
}
