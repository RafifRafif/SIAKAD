'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Award, TrendingUp, Calendar } from 'lucide-react';
import dynamic from 'next/dynamic';
import { StatCard } from '../../components/dashboard/StatCard';
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

export default function SiswaDashboard() {
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
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Selamat Datang!
        </h2>
        <p className="text-gray-600">Pantau perkembangan akademikmu di sini</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Award}
          label="Rata-rata Nilai"
          value={averageGrade ? averageGrade.toFixed(2) : '0'}
          trend=""
          trendUp={true}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard
          icon={Calendar}
          label="Presensi Bulan Ini"
          value={`${attendancePercent.toFixed(1)}%`}
          trend=""
          trendUp={true}
          color="bg-green-100 text-green-600"
        />
        <StatCard
          icon={BookOpen}
          label="Progress Hafalan"
          value={`${quranProgress} Juz`}
          color="bg-purple-100 text-purple-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Peringkat Kelas"
          value={rankLabel}
          trend=""
          trendUp={true}
          color="bg-orange-100 text-orange-600"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <SiswaGradeChart />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Jadwal Hari Ini</h3>
          <div className="space-y-4">
            {assignments.slice(0, 3).map((jadwal) => (
              <div
                key={jadwal.id}
                className="p-3 border border-gray-200 rounded-lg hover:border-[#2563EB] transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-gray-900 text-sm">
                    {jadwal.nama}
                  </span>
                  <span className="text-xs text-gray-500">{jadwal.kelas}</span>
                </div>
                <p className="text-xs text-gray-600">{jadwal.guruPengampu}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Nilai Terbaru
          </h3>
          <div className="space-y-3">
            {grades.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
              >
                <div>
                  <p className="font-semibold text-gray-900">{item.mapel}</p>
                  <p className="text-xs text-gray-600">{item.jenis}</p>
                </div>
                <span
                  className={`px-4 py-2 rounded-lg font-bold ${
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
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-[#2563EB] to-blue-600 rounded-xl p-6 text-white shadow-lg"
        >
          <h3 className="text-lg font-semibold mb-4">Progress Hafalan Al-Qur'an</h3>
          <div className="mb-6">
            <div className="flex justify-between mb-2">
              <span>Progress Hafalan</span>
              <span className="font-bold">{quranProgress} / 30 Juz</span>
            </div>
            <div className="w-full bg-white/30 rounded-full h-3">
              <div
                className="bg-white h-3 rounded-full transition-all"
                style={{ width: `${quranProgressPercent}%` }}
              />
            </div>
            <p className="text-xs text-blue-100 mt-2">{quranProgressPercent.toFixed(1)}% selesai</p>
          </div>
          <div className="space-y-2 text-sm">
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
