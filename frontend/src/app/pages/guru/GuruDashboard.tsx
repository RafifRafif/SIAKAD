'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  FileText,
  GraduationCap,
  Stethoscope,
  UserX,
  type LucideIcon,
} from 'lucide-react';
import { motion } from 'motion/react';
import { getAuthSession, getCurrentGuruAccess, type GuruAccess } from '../../lib/authStore';
import {
  emptyDashboardSummary,
  getAttendanceRecords,
  getDashboardSummary,
  getLearningTasks,
  getTodaySchedule,
  type AttendanceRecordItem,
  type DashboardSummary,
  type LearningAssignmentItem,
  type LearningTaskItem,
} from '../../lib/academicActivityStore';

type AttendanceStatusCode = 'H' | 'A' | 'I' | 'S';

interface GuruMetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  caption: string;
  color: string;
  iconColor: string;
  iconBg: string;
}

function GuruMetricCard({ icon: Icon, label, value, caption, color, iconColor, iconBg }: GuruMetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      className="relative overflow-hidden rounded-xl border border-blue-50 bg-white p-6 shadow-sm transition-shadow hover:shadow-lg"
    >
      <div className="absolute -bottom-16 -right-10 h-32 w-44 rounded-tl-[120px] bg-blue-50/70" />
      <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-[#2563EB] via-cyan-400 to-transparent" />
      <div className="absolute right-7 top-6 grid grid-cols-3 gap-1 opacity-30">
        {Array.from({ length: 9 }).map((_, index) => (
          <span key={index} className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
        ))}
      </div>
      <div className={`absolute inset-x-0 bottom-0 h-1.5 ${color}`} />
      <div className="relative flex items-start gap-5">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${iconBg} ${iconColor} shadow-sm`}>
          <Icon size={27} />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#526083]">{label}</p>
          <p className="mt-2 text-3xl font-bold leading-none text-[#08173f]">{value}</p>
          <p className="mt-2 text-sm font-medium text-[#526083]">{caption}</p>
        </div>
      </div>
    </motion.div>
  );
}

interface ActionCardProps {
  href: string;
  label: string;
  icon?: LucideIcon;
  primary?: boolean;
}

function ActionCard({ href, label, icon: Icon, primary = false }: ActionCardProps) {
  return (
    <Link
      href={href}
      className={`group flex items-center justify-between rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
        primary
          ? 'bg-[#2563EB] text-white shadow-sm hover:bg-blue-700'
          : 'border border-blue-100 bg-white text-[#111b45] hover:border-[#2563EB] hover:bg-blue-50 hover:text-[#2563EB]'
      }`}
    >
      <span className="flex items-center gap-3">
        {Icon && <Icon size={18} />}
        {label}
      </span>
      <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

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
  const [summary, setSummary] = useState<DashboardSummary>(emptyDashboardSummary);
  const [assignments, setAssignments] = useState<LearningAssignmentItem[]>([]);
  const [tasks, setTasks] = useState<LearningTaskItem[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecordItem[]>([]);

  useEffect(() => {
    const loadSession = async () => {
      const [access, session, dashboardSummary, assignmentItems, taskItems] = await Promise.all([
        getCurrentGuruAccess(),
        getAuthSession(),
        getDashboardSummary(),
        getTodaySchedule(),
        getLearningTasks(),
      ]);

      setGuruAccess(access);
      setSummary(dashboardSummary);
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
  const uniqueClasses = new Set(assignments.map((item) => item.kelas)).size;
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
      if (document.visibilityState === 'hidden') {
        return;
      }

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
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#0064ff] via-[#2f68ff] to-[#7660f6] p-6 text-white shadow-sm">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full border border-white/20" />
        <div className="absolute -right-8 bottom-0 h-52 w-[400px] rounded-tl-[200px] bg-white/10" />
        <div className="absolute -left-12 top-8 h-28 w-28 rounded-full bg-cyan-300/20 blur-2xl" />
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-cyan-200/80 via-white/60 to-violet-200/60" />
        <div className="absolute right-[34%] top-16 grid grid-cols-4 gap-3 opacity-30">
          {Array.from({ length: 16 }).map((_, index) => (
            <span key={index} className="h-1.5 w-1.5 rounded-full bg-white" />
          ))}
        </div>
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex rounded-lg bg-[#0f4eb8]/60 px-4 py-2 text-xs font-semibold uppercase tracking-wide">
              Dashboard Guru
            </span>
            <h2 className="mt-4 text-2xl font-bold leading-tight">
              Selamat Datang, {displayName}
            </h2>
            <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-white/95">
              Pantau presensi, penilaian, dan aktivitas pembelajaran dari satu ruang kerja yang mengikuti akses guru.
            </p>
          </div>
        </div>
      </div>

      {hasGuruMapel && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <GuruMetricCard
            icon={BookOpen}
            label="Mapel Diampu"
            value={assignments.length}
            caption="Mata pelajaran"
            color="bg-gradient-to-r from-[#2563EB] to-blue-200"
            iconBg="bg-indigo-50"
            iconColor="text-indigo-600"
          />
          <GuruMetricCard
            icon={FileText}
            label="Input Nilai Akhir"
            value={summary.guru.inputNilai}
            caption="Siswa"
            color="bg-gradient-to-r from-orange-500 to-orange-100"
            iconBg="bg-orange-50"
            iconColor="text-orange-500"
          />
        </div>
      )}

      {hasWaliKelas && !hasGuruMapel && (
        <div className="grid gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="relative overflow-hidden rounded-xl border border-blue-50 bg-white p-6 shadow-sm"
          >
            <div className="absolute -right-24 -top-28 h-64 w-64 rounded-full bg-blue-50" />
            <div className="absolute -bottom-20 left-1/3 h-44 w-80 rounded-t-[160px] bg-indigo-50/60" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#eff6ff_1px,transparent_1px),linear-gradient(to_bottom,#eff6ff_1px,transparent_1px)] bg-[size:28px_28px] opacity-40" />
            <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#2563EB] via-cyan-400 to-violet-500" />
            <div className="absolute right-12 top-10 grid grid-cols-4 gap-2 opacity-20">
              {Array.from({ length: 16 }).map((_, index) => (
                <span key={index} className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
              ))}
            </div>
            <div className="relative">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <span className="inline-flex rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#2563EB]">
                    Ruang Wali Kelas
                  </span>
                  <h3 className="mt-3 text-xl font-bold text-[#111b45]">Monitoring Kelas Hari Ini</h3>
                  <p className="mt-1 text-sm text-[#526083]">
                    Pantau presensi, nilai, dan setoran Al-Qur&apos;an siswa wali kelas.
                  </p>
                </div>
                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
                  Wali Kelas
                </span>
              </div>

              <div className="mb-5 grid gap-3 sm:grid-cols-4">
                {attendanceCards.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.label} className="rounded-xl border border-blue-50 bg-white/80 px-4 py-3 shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-[#526083]">{item.label}</p>
                          <p className="mt-1 text-xl font-bold text-[#08173f]">{item.value}</p>
                        </div>
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${item.color}`}>
                          <Icon size={18} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <ActionCard href="/guru/monitoring-presensi" label="Monitoring Presensi" primary />
                <ActionCard href="/guru/rekap-nilai" label="Monitoring Nilai" />
                <ActionCard href="/guru/riwayat-quran" label="Monitoring Setoran" />
              </div>
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
            className="relative overflow-hidden rounded-xl border border-blue-50 bg-white p-6 shadow-sm"
          >
            <div className="absolute -right-24 -top-28 h-64 w-64 rounded-full bg-blue-50" />
            <div className="absolute -bottom-20 left-1/3 h-44 w-80 rounded-t-[160px] bg-indigo-50/60" />
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#eff6ff_1px,transparent_1px),linear-gradient(to_bottom,#eff6ff_1px,transparent_1px)] bg-[size:28px_28px] opacity-40" />
            <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#2563EB] via-cyan-400 to-violet-500" />
            <div className="absolute right-12 top-10 grid grid-cols-4 gap-2 opacity-20">
              {Array.from({ length: 16 }).map((_, index) => (
                <span key={index} className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
              ))}
            </div>
            <div className="relative">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#2563EB]">
                  Ruang Guru Mapel
                </span>
                <h3 className="mt-3 text-xl font-bold text-[#111b45]">Kelas dan Mapel Hari Ini</h3>
                <p className="mt-1 text-sm text-[#526083]">Kelola presensi, penilaian, dan jadwal mengajar.</p>
              </div>
              <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
                Guru Mapel
              </span>
            </div>

            <div className="mb-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-blue-50 bg-white/80 px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#526083]">Mapel</p>
                <p className="mt-1 text-xl font-bold text-[#08173f]">{assignments.length}</p>
              </div>
              <div className="rounded-xl border border-emerald-50 bg-white/80 px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#526083]">Kelas</p>
                <p className="mt-1 text-xl font-bold text-[#08173f]">{uniqueClasses}</p>
              </div>
              <div className="rounded-xl border border-orange-50 bg-white/80 px-4 py-3 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#526083]">Nilai</p>
                <p className="mt-1 text-xl font-bold text-[#08173f]">{summary.guru.inputNilai}</p>
              </div>
            </div>

            <div className="space-y-4">
              {assignments.slice(0, 3).map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 + index * 0.08 }}
                  className="group relative overflow-hidden rounded-lg border border-blue-50 bg-white/95 p-4 shadow-sm transition-all hover:border-[#2563EB] hover:shadow-md"
                >
                  <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#2563EB] to-cyan-400 opacity-70" />
                  <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-indigo-50 transition-transform group-hover:scale-125" />
                  <div className="flex items-center justify-between gap-3">
                    <div className="relative flex min-w-0 items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors group-hover:bg-[#2563EB] group-hover:text-white">
                        <BookOpen size={22} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#111b45]">{item.nama}</p>
                        <p className="mt-1 truncate text-sm text-[#526083]">{item.guruPengampu}</p>
                      </div>
                    </div>
                    <div className="relative flex items-center gap-3">
                      <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
                        {item.kelas}
                      </span>
                      <ArrowRight size={18} className="text-[#08173f] transition-transform group-hover:translate-x-1 group-hover:text-[#2563EB]" />
                    </div>
                  </div>
                </motion.div>
              ))}
              {assignments.length === 0 && (
                <div className="rounded-lg border border-dashed border-blue-100 px-4 py-6 text-center text-sm text-[#526083]">
                  Jadwal mengajar akan tampil setelah tersedia di backend.
                </div>
              )}
            </div>
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
