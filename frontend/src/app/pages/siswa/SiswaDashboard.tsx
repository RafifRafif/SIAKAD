'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Award, TrendingUp, Calendar, type LucideIcon } from 'lucide-react';
import dynamic from 'next/dynamic';
import { motion } from 'motion/react';
import { getAuthSession } from '../../lib/authStore';
import {
  getAttendanceRecords,
  getGrades,
  getQuranSubmissions,
  getStudentInsights,
  getTodaySchedule,
  type AttendanceRecordItem,
  type LearningAssignmentItem,
  type QuranSubmissionItem,
  type StudentInsights,
  type StudentGradeItem,
} from '../../lib/academicActivityStore';

const SiswaGradeChart = dynamic(() => import('./SiswaGradeChart'), {
  ssr: false,
  loading: () => (
    <div className="h-[397px] animate-pulse rounded-xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
      <div className="mb-6 h-6 w-56 rounded bg-gray-200" />
      <div className="h-[300px] rounded-lg bg-gray-100" />
    </div>
  ),
});

interface SiswaMetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  caption: string;
  color: string;
  iconColor: string;
  iconBg: string;
}

function SiswaMetricCard({ icon: Icon, label, value, caption, color, iconColor, iconBg }: SiswaMetricCardProps) {
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

export default function SiswaDashboard() {
  const [displayName, setDisplayName] = useState('Siswa');
  const [grades, setGrades] = useState<StudentGradeItem[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecordItem[]>([]);
  const [quranSubmissions, setQuranSubmissions] = useState<QuranSubmissionItem[]>([]);
  const [assignments, setAssignments] = useState<LearningAssignmentItem[]>([]);
  const [insights, setInsights] = useState<StudentInsights>({
    rank: null,
    classSize: 0,
    notes: [],
    achievements: [],
  });

  useEffect(() => {
    const loadData = async () => {
      const session = await getAuthSession();
      const nis = session?.username;
      const params = nis ? { nis } : {};
      setDisplayName(session?.displayName ?? 'Siswa');

      const [gradeItems, attendanceItems, quranItems, assignmentItems, insightItems] = await Promise.all([
        getGrades(params),
        getAttendanceRecords(params),
        getQuranSubmissions(params),
        getTodaySchedule(),
        getStudentInsights(params),
      ]);

      setGrades(gradeItems);
      setAttendanceRecords(attendanceItems);
      setQuranSubmissions(quranItems);
      setAssignments(assignmentItems);
      setInsights(insightItems);
    };

    void loadData().catch(() => {
      setGrades([]);
      setAttendanceRecords([]);
      setQuranSubmissions([]);
      setAssignments([]);
      setDisplayName('Siswa');
      setInsights({ rank: null, classSize: 0, notes: [], achievements: [] });
    });
  }, []);

  const averageGrade = useMemo(() => {
    if (grades.length === 0) {
      return 0;
    }

    return grades.reduce((total, item) => total + Number(item.nilai), 0) / grades.length;
  }, [grades]);
  const attendancePercent = useMemo(() => {
    if (attendanceRecords.length === 0) {
      return 0;
    }

    const presentCount = attendanceRecords.filter((item) => item.statusCode === 'H').length;
    return (presentCount / attendanceRecords.length) * 100;
  }, [attendanceRecords]);
  const latestQuran = quranSubmissions[0];
  const quranProgress = Math.max(...quranSubmissions.map((item) => item.progress), 0);
  const quranProgressPercent = (quranProgress / 30) * 100;
  const rankLabel = insights.rank ? `${insights.rank}/${insights.classSize}` : '-';

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
            <p className="inline-flex rounded-lg bg-[#0f4eb8]/60 px-4 py-2 text-xs font-semibold uppercase tracking-wide">
              Dashboard Siswa
            </p>
            <h2 className="mt-4 text-2xl font-bold leading-tight">
              Selamat Datang, {displayName}
            </h2>
            <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-white/95">
              Pantau nilai, presensi, jadwal, dan progres Al-Qur'an dengan tampilan yang ringkas.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:w-[360px]">
            <div className="rounded-xl bg-white/15 px-4 py-3 ring-1 ring-white/20 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Rata-rata Nilai</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {averageGrade ? averageGrade.toFixed(2) : '0'}
              </p>
            </div>
            <div className="rounded-xl bg-white/15 px-4 py-3 ring-1 ring-white/20 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Presensi Bulan Ini</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {attendancePercent.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <SiswaMetricCard
          icon={Award}
          label="Rata-rata Nilai"
          value={averageGrade ? averageGrade.toFixed(2) : '0'}
          caption="Akademik"
          color="bg-gradient-to-r from-[#2563EB] to-blue-200"
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <SiswaMetricCard
          icon={Calendar}
          label="Presensi Bulan Ini"
          value={`${attendancePercent.toFixed(1)}%`}
          caption="Kehadiran"
          color="bg-gradient-to-r from-emerald-500 to-emerald-100"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <SiswaMetricCard
          icon={BookOpen}
          label="Progress Hafalan"
          value={`${quranProgress} Juz`}
          caption="Al-Qur'an"
          color="bg-gradient-to-r from-violet-500 to-violet-100"
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
        />
        <SiswaMetricCard
          icon={TrendingUp}
          label="Peringkat Kelas"
          value={rankLabel}
          caption="Ranking"
          color="bg-gradient-to-r from-orange-500 to-orange-100"
          iconBg="bg-orange-50"
          iconColor="text-orange-500"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <SiswaGradeChart />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="relative overflow-hidden rounded-xl border border-blue-50 bg-white p-6 shadow-sm"
        >
          <div className="absolute -right-20 -top-24 h-52 w-52 rounded-full bg-blue-50" />
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#2563EB] via-cyan-400 to-violet-500" />
          <div className="relative">
            <span className="inline-flex rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#2563EB]">
              Jadwal
            </span>
            <h3 className="mt-3 mb-6 text-lg font-bold text-[#111b45]">Jadwal Hari Ini</h3>
          </div>
          <div className="relative space-y-4">
            {assignments.slice(0, 3).map((jadwal) => (
              <div
                key={jadwal.id}
                className="group relative overflow-hidden rounded-lg border border-blue-50 bg-white/95 p-4 shadow-sm transition-all hover:border-[#2563EB] hover:shadow-md"
              >
                <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#2563EB] to-cyan-400 opacity-70" />
                <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-indigo-50 transition-transform group-hover:scale-125" />
                <div className="relative flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <BookOpen size={20} />
                    </div>
                    <div className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-[#111b45]">
                        {jadwal.nama}
                      </span>
                      <p className="mt-1 truncate text-xs text-[#526083]">{jadwal.guruPengampu}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
                    {jadwal.kelas}
                  </span>
                </div>
              </div>
            ))}
            {assignments.length === 0 && (
              <div className="rounded-lg border border-dashed border-blue-100 px-4 py-6 text-center text-sm text-[#526083]">
                Jadwal hari ini akan tampil setelah tersedia.
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative overflow-hidden rounded-xl border border-blue-50 bg-white p-6 shadow-sm"
        >
          <div className="absolute -right-24 -top-28 h-64 w-64 rounded-full bg-blue-50" />
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#2563EB] via-cyan-400 to-violet-500" />
          <div className="relative">
            <span className="inline-flex rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#2563EB]">
              Akademik
            </span>
            <h3 className="mt-3 mb-4 text-lg font-bold text-[#111b45]">Nilai Terbaru</h3>
          </div>
          <div className="relative space-y-3">
            {grades.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="group flex items-center justify-between rounded-lg border border-blue-50 bg-white/95 p-3 shadow-sm transition-all hover:border-[#2563EB] hover:shadow-md"
              >
                <div>
                  <p className="font-semibold text-[#111b45]">{item.mapel}</p>
                  <p className="text-xs text-[#526083]">{item.jenis}</p>
                </div>
                <span
                  className={`rounded-lg px-4 py-2 font-bold ${
                    item.nilai >= 90
                      ? 'bg-green-100 text-green-700'
                      : item.nilai >= 80
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {item.nilai}
                </span>
              </div>
            ))}
            {grades.length === 0 && (
              <div className="rounded-lg border border-dashed border-blue-100 px-4 py-6 text-center text-sm text-[#526083]">
                Nilai terbaru akan tampil setelah tersedia.
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#0064ff] via-[#2f68ff] to-[#7660f6] p-6 text-white shadow-lg"
        >
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full border border-white/20" />
          <div className="absolute -right-8 bottom-0 h-44 w-80 rounded-tl-[180px] bg-white/10" />
          <div className="absolute right-12 top-10 grid grid-cols-4 gap-2 opacity-25">
            {Array.from({ length: 16 }).map((_, index) => (
              <span key={index} className="h-1.5 w-1.5 rounded-full bg-white" />
            ))}
          </div>
          <div className="relative">
            <span className="inline-flex rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ring-1 ring-white/20">
              Al-Qur'an
            </span>
            <h3 className="mt-3 mb-4 text-lg font-semibold">Progress Hafalan Al-Qur'an</h3>
          </div>
          <div className="relative mb-6">
            <div className="mb-2 flex justify-between">
              <span>Progress Hafalan</span>
              <span className="font-bold">{quranProgress} / 30 Juz</span>
            </div>
            <div className="h-3 w-full rounded-full bg-white/30">
              <div
                className="h-3 rounded-full bg-white transition-all"
                style={{ width: `${quranProgressPercent}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-blue-100">{quranProgressPercent.toFixed(1)}% selesai</p>
          </div>
          <div className="relative space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Surah Terakhir:</span>
              <span className="font-medium">{latestQuran?.surah ?? '-'}</span>
            </div>
            <div className="flex justify-between">
              <span>Ayat Terakhir:</span>
              <span className="font-medium">
                {latestQuran ? `Ayat ${latestQuran.ayatSelesai}` : '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Penilaian:</span>
              <span className="px-2 py-1 bg-white/20 rounded-full font-medium text-xs">
                {latestQuran?.penilaian ?? '-'}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
