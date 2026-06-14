'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  CheckCircle2,
  GraduationCap,
  Stethoscope,
  UserX,
} from 'lucide-react';
import { motion } from 'motion/react';
import { getAuthSession, getCurrentGuruAccess, type GuruAccess } from '../../lib/authStore';
import {
  getAttendanceRecords,
  getLearningTasks,
  getTodaySchedule,
  type AttendanceRecordItem,
  type LearningAssignmentItem,
  type LearningTaskItem,
} from '../../lib/academicActivityStore';

type AttendanceStatusCode = 'H' | 'A' | 'I' | 'S';

const todayDateValue = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export default function GuruDashboard() {
  const [guruAccess, setGuruAccess] = useState<GuruAccess[]>([]);
  const [displayName, setDisplayName] = useState('Ustadz/Ustadzah');
  const [isReady, setIsReady] = useState(false);
  const [assignments, setAssignments] = useState<LearningAssignmentItem[]>([]);
  const [tasks, setTasks] = useState<LearningTaskItem[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecordItem[]>([]);

  useEffect(() => {
    const loadSession = async () => {
      const [access, session, assignmentItems, taskItems] = await Promise.all([
        getCurrentGuruAccess(),
        getAuthSession(),
        getTodaySchedule(),
        getLearningTasks(),
      ]);

      setGuruAccess(access);
      setAssignments(assignmentItems);
      setTasks(taskItems);

      if (session?.role === 'guru') {
        setDisplayName(session.displayName);
      }

      setIsReady(true);
    };

    void loadSession().catch(() => setIsReady(true));
  }, []);

  const hasWaliKelas = guruAccess.includes('Wali Kelas');
  const hasGuruMapel = guruAccess.includes('Guru Mapel');
  const accessLabel = guruAccess.length > 0 ? guruAccess.join(' & ') : 'Belum ada akses';
  const today = todayDateValue();
  const todayAttendanceRecords = useMemo(
    () => attendanceRecords.filter((record) => record.tanggal === today),
    [attendanceRecords, today]
  );
  const attendanceSummary = useMemo(
    () =>
      todayAttendanceRecords.reduce<Record<AttendanceStatusCode, number>>(
        (summary, record) => {
          if (record.statusCode === 'H' || record.statusCode === 'A' || record.statusCode === 'I' || record.statusCode === 'S') {
            summary[record.statusCode] += 1;
          }

          return summary;
        },
        { H: 0, A: 0, I: 0, S: 0 }
      ),
    [todayAttendanceRecords]
  );
  const attendanceCards = [
    {
      label: 'Siswa Hadir',
      value: attendanceSummary.H,
      icon: CheckCircle2,
      color: 'bg-green-50 text-green-700 ring-green-100',
    },
    {
      label: 'Siswa Alpha',
      value: attendanceSummary.A,
      icon: UserX,
      color: 'bg-red-50 text-red-700 ring-red-100',
    },
    {
      label: 'Siswa Izin',
      value: attendanceSummary.I,
      icon: Activity,
      color: 'bg-blue-50 text-blue-700 ring-blue-100',
    },
    {
      label: 'Siswa Sakit',
      value: attendanceSummary.S,
      icon: Stethoscope,
      color: 'bg-amber-50 text-amber-700 ring-amber-100',
    },
  ];

  useEffect(() => {
    if (!hasWaliKelas) {
      return;
    }

    let isMounted = true;

    const loadAttendanceSummary = async () => {
      try {
        const items = await getAttendanceRecords();

        if (isMounted) {
          setAttendanceRecords(items);
        }
      } catch {
        if (isMounted) {
          setAttendanceRecords([]);
        }
      }
    };

    void loadAttendanceSummary();
    const intervalId = window.setInterval(loadAttendanceSummary, 15000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void loadAttendanceSummary();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [hasWaliKelas]);

  if (!isReady) {
    return (
      <div className="space-y-8">
        <div>
          <div className="h-8 w-72 animate-pulse rounded bg-gray-200" />
          <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded bg-gray-100" />
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-28 animate-pulse rounded-xl border border-gray-200 bg-white" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-6 border-l-4 border-[#2563EB] p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#2563EB]">
              Dashboard Guru
            </p>
            <h2 className="mt-2 text-2xl font-bold text-gray-900">
              Selamat Datang, {displayName}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-gray-600">
              Pantau presensi, penilaian, dan aktivitas pembelajaran dari satu ruang kerja yang mengikuti akses guru.
            </p>
          </div>
      </div>
      </div>

      {hasWaliKelas && (
        <div className="grid gap-6">
          <div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {attendanceCards.map((item) => {
                const Icon = item.icon;

                return (
                  <div key={item.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-gray-500">{item.label}</p>
                        <p className="mt-2 text-3xl font-bold text-gray-900">{item.value}</p>
                      </div>
                      <div className={`flex h-12 w-12 items-center justify-center rounded-full ring-1 ${item.color}`}>
                        <Icon size={22} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Ruang Wali Kelas</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Pantau presensi, nilai, dan setoran Al-Qur&apos;an siswa wali kelas.
                </p>
              </div>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                Wali Kelas
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                href="/guru/monitoring-presensi"
                className="flex items-center justify-center rounded-lg bg-[#2563EB] px-3 py-3 text-center text-sm font-medium text-white transition-all hover:bg-blue-700"
              >
                Monitoring Presensi
              </Link>
              <Link
                href="/guru/rekap-nilai"
                className="flex items-center justify-center rounded-lg border border-gray-300 px-3 py-3 text-center text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
              >
                Monitoring Nilai
              </Link>
              <Link
                href="/guru/riwayat-quran"
                className="flex items-center justify-center rounded-lg border border-gray-300 px-3 py-3 text-center text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
              >
                Monitoring Setoran
              </Link>
            </div>
          </motion.div>
        </div>
      )}

      {hasGuruMapel && (
        <div className="grid gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Ruang Guru Mapel</h3>
                <p className="mt-1 text-sm text-gray-600">Kelola presensi, penilaian, dan jadwal mengajar.</p>
              </div>
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
                Guru Mapel
              </span>
            </div>

            <div className="space-y-4">
              {assignments.slice(0, 3).map((item) => (
                <div key={item.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <span className="font-semibold text-gray-900">{item.nama}</span>
                    <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
                      {item.kelas}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{item.guruPengampu}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                href="/guru/presensi"
                className="flex items-center justify-center rounded-lg bg-[#2563EB] px-3 py-3 text-center text-sm font-medium text-white transition-all hover:bg-blue-700"
              >
                Presensi Kelas
              </Link>
              <Link
                href="/guru/nilai"
                className="flex items-center justify-center rounded-lg border border-gray-300 px-3 py-3 text-center text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
              >
                Input Nilai Akhir
              </Link>
              <Link
                href="/guru/nilai-harian"
                className="flex items-center justify-center rounded-lg border border-gray-300 px-3 py-3 text-center text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
              >
                Input Nilai Harian dan Quiz
              </Link>
              <Link
                href="/guru/nilai-harian-quiz"
                className="flex items-center justify-center rounded-lg border border-gray-300 px-3 py-3 text-center text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
              >
                Rekap Nilai Harian dan Quiz
              </Link>
              <Link
                href="/guru/rekap-absensi"
                className="flex items-center justify-center rounded-lg border border-gray-300 px-3 py-3 text-center text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
              >
                Rekap Presensi
              </Link>
              <Link
                href="/guru/quran"
                className="flex items-center justify-center rounded-lg border border-gray-300 px-3 py-3 text-center text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
              >
                Setoran Al-Qur&apos;an
              </Link>
              <Link
                href="/guru/riwayat-quran"
                className="flex items-center justify-center rounded-lg border border-gray-300 px-3 py-3 text-center text-sm font-medium text-gray-700 transition-all hover:bg-gray-50"
              >
                Riwayat Setoran
              </Link>
            </div>
          </motion.div>

        </div>
      )}
      {!hasWaliKelas && !hasGuruMapel && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <GraduationCap size={36} className="mx-auto text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">Belum ada akses guru</h3>
          <p className="mt-2 text-sm text-gray-600">
            Admin perlu memberikan akses Wali Kelas atau Guru Mapel di menu Data Guru.
          </p>
        </div>
      )}
    </div>
  );
}
