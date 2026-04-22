'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { BarChart3, ClipboardList, Users } from 'lucide-react';
import { EmptyState } from '../../components/dashboard/EmptyState';
import { formatTanggalIndonesia, getAttendanceRecords, getCurrentAuthProfile, type BackendAttendanceRecord } from '../../lib/guruData';

export default function RekapAbsensiGuruMapel() {
  const [records, setRecords] = useState<BackendAttendanceRecord[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const profile = await getCurrentAuthProfile();
      if (!profile?.teacher?.id) {
        return;
      }

      const attendanceItems = await getAttendanceRecords({ teacherId: profile.teacher.id });
      setRecords(attendanceItems);
    };

    void loadData();
  }, []);

  const rekapAbsensi = useMemo(
    () =>
      Object.values(
        records.reduce<Record<string, {
          id: string;
          tanggal: string;
          kelas: string;
          mapel: string;
          hadir: number;
          tidakHadir: number;
          keterangan: string;
        }>>((accumulator, item) => {
          const key = `${item.attendance_date.slice(0, 10)}-${item.class?.name ?? '-'}-${item.subject?.name ?? '-'}`;
          if (!accumulator[key]) {
            accumulator[key] = {
              id: key,
              tanggal: formatTanggalIndonesia(item.attendance_date),
              kelas: item.class?.name ?? '-',
              mapel: item.subject?.name ?? '-',
              hadir: 0,
              tidakHadir: 0,
              keterangan: '-',
            };
          }

          if (item.status === 'Hadir') {
            accumulator[key].hadir += 1;
          } else {
            accumulator[key].tidakHadir += 1;
            accumulator[key].keterangan = item.notes || item.status;
          }

          return accumulator;
        }, {})
      ),
    [records]
  );

  const totalPertemuan = rekapAbsensi.length;
  const totalTidakHadir = rekapAbsensi.reduce((sum, item) => sum + item.tidakHadir, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rekap Absensi</h2>
          <p className="mt-1 text-gray-600">
            Lihat rangkuman hasil presensi per kelas dan per pertemuan mata pelajaran
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-3 text-sm font-medium text-[#2563EB]">
          <ClipboardList size={18} />
          Rekap Guru Mapel
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 inline-flex rounded-lg bg-blue-100 p-3 text-[#2563EB]">
            <BarChart3 size={20} />
          </div>
          <p className="text-sm text-gray-600">Total Rekap</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{totalPertemuan} Pertemuan</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 inline-flex rounded-lg bg-green-100 p-3 text-green-600">
            <Users size={20} />
          </div>
          <p className="text-sm text-gray-600">Total Hadir</p>
          <p className="mt-1 text-xl font-bold text-gray-900">
            {rekapAbsensi.reduce((sum, item) => sum + item.hadir, 0)} Siswa
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 inline-flex rounded-lg bg-amber-100 p-3 text-amber-600">
            <ClipboardList size={20} />
          </div>
          <p className="text-sm text-gray-600">Total Tidak Hadir</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{totalTidakHadir} Siswa</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
      >
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="font-semibold text-gray-900">Riwayat Rekap Absensi</h3>
          <p className="mt-1 text-sm text-gray-600">
            Ringkasan kehadiran siswa berdasarkan presensi yang sudah diinput
          </p>
        </div>

        {rekapAbsensi.length === 0 ? (
          <EmptyState
            message="Belum ada rekap absensi"
            description="Presensi yang Anda input akan tampil di sini."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Tanggal</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Kelas</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Mata Pelajaran</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Hadir</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Tidak Hadir</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rekapAbsensi.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-700">{item.tanggal}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.kelas}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{item.mapel}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="rounded-full bg-green-100 px-3 py-1 font-medium text-green-700">
                        {item.hadir} siswa
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="rounded-full bg-red-100 px-3 py-1 font-medium text-red-700">
                        {item.tidakHadir} siswa
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{item.keterangan}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
