'use client';

import { useEffect, useMemo, useState } from 'react';
import { Users, GraduationCap, ClipboardCheck, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { StatCard } from '../../components/dashboard/StatCard';
import { EmptyState } from '../../components/dashboard/EmptyState';
import { Toast, useToast } from '../../components/dashboard/Toast';
import { getCurrentAuthProfile, type BackendAttendanceRecord, type BackendGradeEntry } from '../../lib/guruData';
import { apiRequest } from '../../lib/api';
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

type AdminDashboardContext = {
  total_students?: number;
  total_teachers?: number;
  total_classes?: number;
  total_subjects?: number;
  grade_weight_count?: number;
};

const weekdayLabels = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const formatPercent = (value: number | null) => (value === null ? '-' : `${value.toFixed(1)}%`);
const formatAverage = (value: number | null) => (value === null ? '-' : value.toFixed(1));

const getLastSevenDays = () => {
  const days: Date[] = [];
  const today = new Date();

  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    days.push(date);
  }

  return days;
};

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

export default function AdminDashboard() {
  const router = useRouter();
  const [dashboardContext, setDashboardContext] = useState<AdminDashboardContext>({});
  const [attendanceRecords, setAttendanceRecords] = useState<BackendAttendanceRecord[]>([]);
  const [gradeEntries, setGradeEntries] = useState<BackendGradeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const profile = await getCurrentAuthProfile();
        const [attendanceResponse, gradeEntriesResponse] = await Promise.all([
          apiRequest<{ data: BackendAttendanceRecord[] }>('/attendance-records'),
          apiRequest<{ data: BackendGradeEntry[] }>('/grade-entries'),
        ]);

        setDashboardContext((profile?.dashboard_context ?? {}) as AdminDashboardContext);
        setAttendanceRecords(attendanceResponse.data);
        setGradeEntries(gradeEntriesResponse.data);
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : 'Gagal memuat ringkasan dashboard admin.',
          'error'
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadDashboardData();
  }, []);

  const todayAttendanceRate = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const todaysRecords = attendanceRecords.filter(
      (record) => record.attendance_date.slice(0, 10) === today
    );

    if (todaysRecords.length === 0) {
      return null;
    }

    const presentCount = todaysRecords.filter((record) => record.status === 'Hadir').length;
    return (presentCount / todaysRecords.length) * 100;
  }, [attendanceRecords]);

  const gradeAverage = useMemo(() => {
    if (gradeEntries.length === 0) {
      return null;
    }

    const totalScore = gradeEntries.reduce((total, entry) => total + Number(entry.score), 0);
    return totalScore / gradeEntries.length;
  }, [gradeEntries]);

  const attendanceChartData = useMemo(() => {
    const lastSevenDays = getLastSevenDays();

    return lastSevenDays.map((date) => {
      const dateKey = date.toISOString().slice(0, 10);
      const records = attendanceRecords.filter(
        (record) => record.attendance_date.slice(0, 10) === dateKey
      );

      return {
        name: weekdayLabels[date.getDay()],
        hadir: records.filter((record) => record.status === 'Hadir').length,
        tidak: records.filter((record) => record.status === 'Tidak Hadir').length,
      };
    });
  }, [attendanceRecords]);

  const gradeChartData = useMemo(() => {
    const lastSixMonths = getLastSixMonths();

    return lastSixMonths.map(({ month, year, label }) => {
      const monthlyEntries = gradeEntries.filter((entry) => {
        const entryDate = new Date(entry.entry_date);
        return entryDate.getMonth() === month && entryDate.getFullYear() === year;
      });

      const average =
        monthlyEntries.length > 0
          ? monthlyEntries.reduce((total, entry) => total + Number(entry.score), 0) /
            monthlyEntries.length
          : null;

      return {
        bulan: label,
        rata: average,
      };
    });
  }, [gradeEntries]);

  const recentActivities = useMemo(() => {
    const attendanceActivities = attendanceRecords.map((record) => ({
      id: `attendance-${record.id}`,
      date: record.attendance_date,
      action: `Presensi ${record.student?.name ?? 'siswa'} dicatat dengan status ${record.status}.`,
    }));

    const gradeActivities = gradeEntries.map((entry) => ({
      id: `grade-${entry.id}`,
      date: entry.entry_date,
      action: `Nilai ${entry.subject?.name ?? 'pelajaran'} untuk ${entry.student?.name ?? 'siswa'} diinput: ${entry.score}.`,
    }));

    return [...attendanceActivities, ...gradeActivities]
      .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
      .slice(0, 5);
  }, [attendanceRecords, gradeEntries]);

  const hasAttendanceChartData = attendanceChartData.some(
    (item) => item.hadir > 0 || item.tidak > 0
  );
  const hasGradeChartData = gradeChartData.some((item) => item.rata !== null);

  return (
    <div className="space-y-8">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      <div>
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Dashboard Admin</h2>
        <p className="text-gray-600">
          Ringkasan ini hanya menampilkan data yang benar-benar ada di database.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Siswa"
          value={isLoading ? '...' : dashboardContext.total_students ?? 0}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          icon={GraduationCap}
          label="Total Guru"
          value={isLoading ? '...' : dashboardContext.total_teachers ?? 0}
          color="bg-green-100 text-green-600"
        />
        <StatCard
          icon={ClipboardCheck}
          label="Presensi Hari Ini"
          value={isLoading ? '...' : formatPercent(todayAttendanceRate)}
          color="bg-purple-100 text-purple-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Rata-rata Nilai"
          value={isLoading ? '...' : formatAverage(gradeAverage)}
          color="bg-orange-100 text-orange-600"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h3 className="mb-6 text-lg font-semibold text-gray-900">Grafik Presensi 7 Hari Terakhir</h3>
          {isLoading ? (
            <div className="py-10 text-center text-sm text-gray-500">
              Memuat data presensi...
            </div>
          ) : !hasAttendanceChartData ? (
            <EmptyState
              message="Belum ada data presensi"
              description="Grafik akan muncul setelah presensi tersimpan di database."
            />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="hadir" fill="#2563EB" name="Hadir" radius={[8, 8, 0, 0]} />
                <Bar dataKey="tidak" fill="#EF4444" name="Tidak Hadir" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h3 className="mb-6 text-lg font-semibold text-gray-900">Trend Rata-rata Nilai</h3>
          {isLoading ? (
            <div className="py-10 text-center text-sm text-gray-500">
              Memuat data nilai...
            </div>
          ) : !hasGradeChartData ? (
            <EmptyState
              message="Belum ada data nilai"
              description="Grafik akan muncul setelah guru menyimpan nilai ke database."
            />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={gradeChartData}>
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
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h3 className="mb-6 text-lg font-semibold text-gray-900">Aksi Cepat</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button
            onClick={() => void router.push('/admin/siswa')}
            className="group flex flex-col items-center justify-center rounded-xl border-2 border-gray-200 p-6 transition-all hover:border-[#2563EB] hover:bg-blue-50"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-[#2563EB] transition-transform group-hover:scale-110">
              <Users size={24} />
            </div>
            <span className="font-medium text-gray-900">Data Siswa</span>
          </button>
          <button
            onClick={() => void router.push('/admin/guru')}
            className="group flex flex-col items-center justify-center rounded-xl border-2 border-gray-200 p-6 transition-all hover:border-[#2563EB] hover:bg-blue-50"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600 transition-transform group-hover:scale-110">
              <GraduationCap size={24} />
            </div>
            <span className="font-medium text-gray-900">Data Guru</span>
          </button>
          <button
            onClick={() => void router.push('/admin/kelas')}
            className="group flex flex-col items-center justify-center rounded-xl border-2 border-gray-200 p-6 transition-all hover:border-[#2563EB] hover:bg-blue-50"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 transition-transform group-hover:scale-110">
              <ClipboardCheck size={24} />
            </div>
            <span className="font-medium text-gray-900">Data Kelas</span>
          </button>
          <button
            onClick={() => void router.push('/admin/pelajaran')}
            className="group flex flex-col items-center justify-center rounded-xl border-2 border-gray-200 p-6 transition-all hover:border-[#2563EB] hover:bg-blue-50"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-600 transition-transform group-hover:scale-110">
              <TrendingUp size={24} />
            </div>
            <span className="font-medium text-gray-900">Data Pembelajaran</span>
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
      >
        <h3 className="mb-6 text-lg font-semibold text-gray-900">Aktivitas Terbaru</h3>
        {isLoading ? (
          <div className="py-10 text-center text-sm text-gray-500">Memuat aktivitas...</div>
        ) : recentActivities.length === 0 ? (
          <EmptyState
            message="Belum ada aktivitas"
            description="Aktivitas akan tampil setelah ada presensi atau nilai yang tersimpan."
          />
        ) : (
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 rounded-lg p-4 transition-colors hover:bg-gray-50"
              >
                <div className="mt-2 h-2 w-2 rounded-full bg-[#2563EB]" />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.action}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {new Date(activity.date).toLocaleDateString('id-ID')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
