'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ClipboardList, Users, BellRing } from 'lucide-react';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { EmptyState } from '../../components/dashboard/EmptyState';
import { StatCard } from '../../components/dashboard/StatCard';
import { formatTanggalIndonesia, getAttendanceRecords, getCurrentAuthProfile, type BackendAttendanceRecord, type BackendSchoolClass } from '../../lib/guruData';

export default function GuruKelasDashboard() {
  const router = useRouter();
  const [homeroomClasses, setHomeroomClasses] = useState<BackendSchoolClass[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<BackendAttendanceRecord[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const profile = await getCurrentAuthProfile();
      const classes = profile?.dashboard_context?.homeroom_classes ?? [];
      setHomeroomClasses(classes);

      const allRecords = await Promise.all(
        classes.map((item) => getAttendanceRecords({ classId: item.id }))
      );

      setAttendanceRecords(allRecords.flat());
    };

    void loadData();
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const totalStudents = homeroomClasses.reduce((sum, item) => sum + (item.student_count ?? 0), 0);
  const todayRecords = attendanceRecords.filter((item) => item.attendance_date.slice(0, 10) === today);
  const needFollowUp = todayRecords.filter((item) => item.status !== 'Hadir').length;
  const weeklyRecords = attendanceRecords.filter((item) => {
    const diff = Date.now() - new Date(item.attendance_date).getTime();
    return diff <= 7 * 24 * 60 * 60 * 1000;
  });

  const reminders = useMemo(
    () =>
      todayRecords
        .filter((item) => item.status !== 'Hadir')
        .slice(0, 3)
        .map((item) => ({
          title: item.student?.name ?? 'Siswa',
          detail: `${item.status} - ${item.notes || formatTanggalIndonesia(item.attendance_date)}`,
          tone: 'bg-amber-50 border-amber-200 text-amber-700',
        })),
    [todayRecords]
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="mb-2 text-2xl font-bold text-gray-900">Dashboard Guru Kelas</h2>
        <p className="text-gray-600">
          Pantau kehadiran, kondisi kelas, dan tindak lanjut siswa setiap hari.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Siswa Kelas" value={String(totalStudents)} color="bg-blue-100 text-blue-600" />
        <StatCard icon={ClipboardList} label="Presensi Hari Ini" value={`${todayRecords.length}/${totalStudents}`} color="bg-green-100 text-green-600" />
        <StatCard icon={CalendarDays} label="Kegiatan Minggu Ini" value={String(weeklyRecords.length)} color="bg-purple-100 text-purple-600" />
        <StatCard icon={BellRing} label="Perlu Tindak Lanjut" value={String(needFollowUp)} color="bg-orange-100 text-orange-600" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <h3 className="mb-6 text-lg font-semibold text-gray-900">Agenda Hari Ini</h3>
          {homeroomClasses.length === 0 ? (
            <EmptyState
              message="Belum ada kelas wali"
              description="Kelas yang ditetapkan admin akan tampil di sini."
            />
          ) : (
            <div className="space-y-4">
              {homeroomClasses.map((item) => (
                <div key={item.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-semibold text-gray-900">{item.name}</span>
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-[#2563EB]">
                      {item.level}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{item.student_count ?? 0} siswa</p>
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
          <h3 className="mb-6 text-lg font-semibold text-gray-900">Pengingat Kelas</h3>
          {reminders.length === 0 ? (
            <EmptyState
              message="Belum ada pengingat"
              description="Pengingat kelas akan tampil di sini setelah ada aktivitas yang perlu ditindaklanjuti."
            />
          ) : (
            <div className="space-y-4">
              {reminders.map((item) => (
                <div key={`${item.title}-${item.detail}`} className={`rounded-lg border p-4 ${item.tone}`}>
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm">{item.detail}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => void router.push('/guru-kelas/presensi')}
              className="rounded-lg bg-[#2563EB] py-3 font-medium text-white transition-all hover:bg-blue-700"
            >
              Monitoring Presensi
            </button>
            <button
              onClick={() => void router.push('/guru-kelas/nilai')}
              className="rounded-lg border border-gray-300 py-3 font-medium text-gray-700 transition-all hover:bg-gray-50"
            >
              Rekap Nilai
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
