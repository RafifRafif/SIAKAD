'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { motion } from 'motion/react';
import { Download, FileText, Calendar } from 'lucide-react';
import { EmptyState } from '../../components/dashboard/EmptyState';
import { Toast, useToast } from '../../components/dashboard/Toast';
import { apiRequest } from '../../lib/api';
import { type BackendAttendanceRecord, type BackendGradeEntry } from '../../lib/guruData';

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const getLastSixMonths = () => {
  const months: Array<{ month: number; year: number; label: string }> = [];
  const today = new Date();

  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date(today.getFullYear(), today.getMonth() - index, 1);
    months.push({
      month: date.getMonth(),
      year: date.getFullYear(),
      label: monthLabels[date.getMonth()],
    });
  }

  return months;
};

export default function LaporanAdmin() {
  const [attendanceRecords, setAttendanceRecords] = useState<BackendAttendanceRecord[]>([]);
  const [gradeEntries, setGradeEntries] = useState<BackendGradeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    const loadReportData = async () => {
      try {
        const [attendanceResponse, gradeResponse] = await Promise.all([
          apiRequest<{ data: BackendAttendanceRecord[] }>('/attendance-records'),
          apiRequest<{ data: BackendGradeEntry[] }>('/grade-entries'),
        ]);

        setAttendanceRecords(attendanceResponse.data);
        setGradeEntries(gradeResponse.data);
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : 'Gagal memuat laporan akademik.',
          'error'
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadReportData();
  }, []);

  const monthlyAttendanceData = useMemo(() => {
    return getLastSixMonths().map(({ month, year, label }) => {
      const monthlyRecords = attendanceRecords.filter((record) => {
        const date = new Date(record.attendance_date);
        return date.getMonth() === month && date.getFullYear() === year;
      });

      if (monthlyRecords.length === 0) {
        return {
          bulan: label,
          hadir: null,
          tidak: null,
        };
      }

      const hadir = monthlyRecords.filter((record) => record.status === 'Hadir').length;
      const tidak = monthlyRecords.filter((record) => record.status === 'Tidak Hadir').length;

      return {
        bulan: label,
        hadir: Number(((hadir / monthlyRecords.length) * 100).toFixed(1)),
        tidak: Number(((tidak / monthlyRecords.length) * 100).toFixed(1)),
      };
    });
  }, [attendanceRecords]);

  const gradeByClassData = useMemo(() => {
    const grouped = gradeEntries.reduce<Record<string, number[]>>((accumulator, entry) => {
      const className = entry.student?.class?.name;
      if (!className) {
        return accumulator;
      }

      accumulator[className] = [...(accumulator[className] ?? []), Number(entry.score)];
      return accumulator;
    }, {});

    return Object.entries(grouped).map(([kelas, scores]) => ({
      kelas,
      rata: Number((scores.reduce((total, score) => total + score, 0) / scores.length).toFixed(1)),
    }));
  }, [gradeEntries]);

  const averageAttendance = useMemo(() => {
    if (attendanceRecords.length === 0) {
      return null;
    }

    const presentCount = attendanceRecords.filter((record) => record.status === 'Hadir').length;
    return Number(((presentCount / attendanceRecords.length) * 100).toFixed(1));
  }, [attendanceRecords]);

  const averageGrade = useMemo(() => {
    if (gradeEntries.length === 0) {
      return null;
    }

    return Number(
      (
        gradeEntries.reduce((total, entry) => total + Number(entry.score), 0) / gradeEntries.length
      ).toFixed(1)
    );
  }, [gradeEntries]);

  const effectiveDays = useMemo(() => {
    return new Set(attendanceRecords.map((record) => record.attendance_date.slice(0, 10))).size;
  }, [attendanceRecords]);

  const hasAttendanceData = monthlyAttendanceData.some(
    (item) => item.hadir !== null || item.tidak !== null
  );
  const hasGradeData = gradeByClassData.length > 0;

  return (
    <div className="space-y-6">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Laporan Akademik</h2>
          <p className="mt-1 text-gray-600">Laporan hanya menampilkan data yang tersimpan di database</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-medium text-white shadow-md transition-all hover:bg-green-700"
        >
          <Download size={20} />
          <span>Export PDF</span>
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h3 className="mb-6 text-lg font-semibold text-gray-900">Rekap Presensi Bulanan (%)</h3>
          {isLoading ? (
            <div className="py-10 text-center text-sm text-gray-500">Memuat laporan presensi...</div>
          ) : !hasAttendanceData ? (
            <EmptyState
              message="Belum ada data presensi"
              description="Grafik laporan presensi akan muncul setelah data tersimpan."
            />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyAttendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bulan" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="hadir" stroke="#10B981" strokeWidth={3} name="Hadir" connectNulls={false} />
                <Line type="monotone" dataKey="tidak" stroke="#EF4444" strokeWidth={3} name="Tidak Hadir" connectNulls={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h3 className="mb-6 text-lg font-semibold text-gray-900">Rata-rata Nilai Per Kelas</h3>
          {isLoading ? (
            <div className="py-10 text-center text-sm text-gray-500">Memuat laporan nilai...</div>
          ) : !hasGradeData ? (
            <EmptyState
              message="Belum ada data nilai"
              description="Grafik nilai per kelas akan muncul setelah nilai disimpan."
            />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={gradeByClassData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="kelas" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="rata" fill="#2563EB" name="Rata-rata" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <Calendar size={24} className="text-[#2563EB]" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Hari Efektif</p>
              <p className="text-2xl font-bold text-gray-900">{isLoading ? '...' : effectiveDays}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
              <FileText size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Rata-rata Kehadiran</p>
              <p className="text-2xl font-bold text-gray-900">
                {isLoading ? '...' : averageAttendance === null ? '-' : `${averageAttendance}%`}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
              <FileText size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Rata-rata Nilai Keseluruhan</p>
              <p className="text-2xl font-bold text-gray-900">{isLoading ? '...' : averageGrade ?? '-'}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
