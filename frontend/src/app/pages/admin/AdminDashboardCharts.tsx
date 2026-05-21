'use client';

import { useEffect, useMemo, useState } from 'react';
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
import {
  getAttendanceRecords,
  getGrades,
  monthLabelFromDate,
  type AttendanceRecordItem,
  type StudentGradeItem,
} from '../../lib/academicActivityStore';

const dayLabel = (value?: string | null) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(date);
};

export default function AdminDashboardCharts() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecordItem[]>([]);
  const [grades, setGrades] = useState<StudentGradeItem[]>([]);

  useEffect(() => {
    void getAttendanceRecords().then(setAttendanceRecords).catch(() => setAttendanceRecords([]));
    void getGrades().then(setGrades).catch(() => setGrades([]));
  }, []);

  const attendanceData = useMemo(() => {
    const grouped = new Map<string, { name: string; hadir: number; tidak: number }>();

    attendanceRecords.forEach((record) => {
      const key = record.tanggal ?? '-';
      const existing = grouped.get(key) ?? {
        name: dayLabel(record.tanggal),
        hadir: 0,
        tidak: 0,
      };

      if (record.statusCode === 'H') {
        existing.hadir += 1;
      } else {
        existing.tidak += 1;
      }

      grouped.set(key, existing);
    });

    return Array.from(grouped.values()).slice(-7);
  }, [attendanceRecords]);

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
