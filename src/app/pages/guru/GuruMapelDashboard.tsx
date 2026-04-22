'use client';

import { useEffect, useMemo, useState } from 'react';
import { BookOpen, FileText, GraduationCap, Clock3 } from 'lucide-react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { StatCard } from '../../components/dashboard/StatCard';
import { EmptyState } from '../../components/dashboard/EmptyState';
import {
  formatTanggalIndonesia,
  getAllSubjects,
  getAttendanceRecords,
  getCurrentAuthProfile,
  getGradeEntries,
  type BackendAttendanceRecord,
  type BackendGradeEntry,
  type BackendTeacherSubject,
} from '../../lib/guruData';

export default function GuruMapelDashboard() {
  const router = useRouter();
  const [subjects, setSubjects] = useState<BackendTeacherSubject[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<BackendAttendanceRecord[]>([]);
  const [gradeEntries, setGradeEntries] = useState<BackendGradeEntry[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const profile = await getCurrentAuthProfile();
      if (!profile?.teacher?.id) {
        return;
      }

      const [subjectItems, attendanceItems, gradeItems] = await Promise.all([
        getAllSubjects(),
        getAttendanceRecords({ teacherId: profile.teacher.id }),
        getGradeEntries({ teacherId: profile.teacher.id }),
      ]);

      setSubjects(subjectItems.filter((item) => item.teacher_id === profile.teacher?.id));
      setAttendanceRecords(attendanceItems);
      setGradeEntries(gradeItems);
    };

    void loadData();
  }, []);

  const kelasDiampu = useMemo(
    () =>
      Array.from(
        new Set(subjects.map((item) => item.school_class?.name).filter(Boolean))
      ),
    [subjects]
  );

  const aktivitasTerbaru = useMemo(
    () =>
      gradeEntries
        .slice(0, 3)
        .map((item) => ({
          title: `Input nilai ${item.assessment_type} ${item.subject?.name ?? '-'}`,
          deadline: formatTanggalIndonesia(item.entry_date),
          tone: 'bg-blue-50 border-blue-200 text-blue-700',
        })),
    [gradeEntries]
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Dashboard Guru Mata Pelajaran</h2>
        <p className="text-gray-600">
          Kelola jadwal mengajar, penilaian, dan progres pembelajaran per mata pelajaran.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={BookOpen} label="Mapel Diampu" value={String(subjects.length)} color="bg-blue-100 text-blue-600" />
        <StatCard icon={GraduationCap} label="Kelas Diampu" value={String(kelasDiampu.length)} color="bg-green-100 text-green-600" />
        <StatCard icon={Clock3} label="Jam Mengajar" value="0" color="bg-purple-100 text-purple-600" />
        <StatCard icon={FileText} label="Penilaian Pending" value={String(Math.max(subjects.length - gradeEntries.length, 0))} color="bg-orange-100 text-orange-600" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h3 className="mb-6 text-lg font-semibold text-gray-900">Jadwal Mengajar Hari Ini</h3>
          {subjects.length === 0 ? (
            <EmptyState
              message="Belum ada penugasan mengajar"
              description="Mata pelajaran dan kelas yang diatur admin akan tampil di sini."
            />
          ) : (
            <div className="space-y-4">
              {subjects.map((item) => (
                <div key={item.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-semibold text-gray-900">{item.name}</span>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-[#2563EB]">
                      {item.school_class?.name ?? '-'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{item.group_type ?? 'Kelompok belum diatur'}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h3 className="mb-6 text-lg font-semibold text-gray-900">Tugas Pembelajaran</h3>
          {aktivitasTerbaru.length === 0 ? (
            <EmptyState
              message="Belum ada aktivitas nilai"
              description="Aktivitas input nilai dari guru mapel akan tampil di sini."
            />
          ) : (
            <div className="space-y-4">
              {aktivitasTerbaru.map((item) => (
                <div key={`${item.title}-${item.deadline}`} className={`rounded-lg border p-4 ${item.tone}`}>
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-semibold">{item.title}</span>
                    <span className="text-xs font-medium">{item.deadline}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => void router.push('/guru-mapel/nilai')}
              className="rounded-lg bg-[#2563EB] py-3 font-medium text-white transition-all hover:bg-blue-700"
            >
              Input Nilai
            </button>
            <button
              onClick={() => void router.push('/guru-mapel/presensi')}
              className="rounded-lg border border-gray-300 py-3 font-medium text-gray-700 transition-all hover:bg-gray-50"
            >
              Presensi Kelas
            </button>
            <button
              onClick={() => void router.push('/guru-mapel/rekap-absensi')}
              className="rounded-lg border border-gray-300 py-3 font-medium text-gray-700 transition-all hover:bg-gray-50 sm:col-span-2"
            >
              Rekap Absensi
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
