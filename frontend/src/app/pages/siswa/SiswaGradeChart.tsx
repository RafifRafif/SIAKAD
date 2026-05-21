'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getAuthSession } from '../../lib/authStore';
import {
  getGrades,
  monthLabelFromDate,
  type StudentGradeItem,
} from '../../lib/academicActivityStore';

export default function SiswaGradeChart() {
  const [grades, setGrades] = useState<StudentGradeItem[]>([]);

  useEffect(() => {
    const loadGrades = async () => {
      const session = await getAuthSession();
      const items = await getGrades(session?.username ? { nis: session.username } : {});
      setGrades(items);
    };

    void loadGrades().catch(() => setGrades([]));
  }, []);

  const gradeData = useMemo(() => {
    const grouped = new Map<string, { bulan: string; total: number; count: number }>();

    grades.forEach((grade) => {
      const bulan = monthLabelFromDate(grade.tanggal) || '-';
      const existing = grouped.get(bulan) ?? { bulan, total: 0, count: 0 };
      existing.total += Number(grade.nilai);
      existing.count += 1;
      grouped.set(bulan, existing);
    });

    return Array.from(grouped.values()).map((item) => ({
      bulan: item.bulan,
      rata: item.count > 0 ? Number((item.total / item.count).toFixed(2)) : 0,
    }));
  }, [grades]);

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
