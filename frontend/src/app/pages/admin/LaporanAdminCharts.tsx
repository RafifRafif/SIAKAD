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
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import {
  getAttendanceRecords,
  getGrades,
  monthLabelFromDate,
  type AttendanceRecordItem,
  type StudentGradeItem,
} from '../../lib/academicActivityStore';

interface LaporanAdminChartsProps {
  bulan?: string;
  kelas?: string;
}

export default function LaporanAdminCharts({ bulan, kelas }: LaporanAdminChartsProps) {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecordItem[]>([]);
  const [grades, setGrades] = useState<StudentGradeItem[]>([]);

  useEffect(() => {
    const params = {
      bulan: bulan === 'Data dari backend' ? undefined : bulan,
      kelas: kelas === 'all' ? undefined : kelas,
    };

    void getAttendanceRecords(params).then(setAttendanceRecords).catch(() => setAttendanceRecords([]));
    void getGrades(params).then(setGrades).catch(() => setGrades([]));
  }, [bulan, kelas]);

  const monthlyData = useMemo(() => {
    const grouped = new Map<string, { bulan: string; hadir: number; tidak: number }>();

    attendanceRecords.forEach((record) => {
      const bulan = monthLabelFromDate(record.tanggal) || '-';
      const existing = grouped.get(bulan) ?? { bulan, hadir: 0, tidak: 0 };

      if (record.statusCode === 'H') {
        existing.hadir += 1;
      } else {
        existing.tidak += 1;
      }

      grouped.set(bulan, existing);
    });

    return Array.from(grouped.values()).map((item) => {
      const total = item.hadir + item.tidak;
      return {
        bulan: item.bulan,
        hadir: total > 0 ? Number(((item.hadir / total) * 100).toFixed(1)) : 0,
        tidak: total > 0 ? Number(((item.tidak / total) * 100).toFixed(1)) : 0,
      };
    });
  }, [attendanceRecords]);

  const gradeData = useMemo(() => {
    const grouped = new Map<string, { kelas: string; total: number; count: number }>();

    grades.forEach((grade) => {
      const kelas = grade.kelas || '-';
      const existing = grouped.get(kelas) ?? { kelas, total: 0, count: 0 };
      existing.total += Number(grade.nilai);
      existing.count += 1;
      grouped.set(kelas, existing);
    });

    return Array.from(grouped.values()).map((item) => ({
      kelas: item.kelas,
      rata: item.count > 0 ? Number((item.total / item.count).toFixed(2)) : 0,
    }));
  }, [grades]);

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
