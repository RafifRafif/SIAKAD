'use client';

import { motion } from 'motion/react';
import { BarChart3, ClipboardList, Users } from 'lucide-react';

const rekapAbsensi = [
  {
    id: 1,
    tanggal: '20 April 2026',
    kelas: 'X-A',
    mapel: 'Matematika',
    hadir: 31,
    tidakHadir: 1,
    keterangan: '1 siswa izin sakit',
  },
  {
    id: 2,
    tanggal: '20 April 2026',
    kelas: 'XI-B',
    mapel: 'Matematika',
    hadir: 30,
    tidakHadir: 2,
    keterangan: '1 sakit, 1 keperluan keluarga',
  },
  {
    id: 3,
    tanggal: '21 April 2026',
    kelas: 'X-A',
    mapel: 'Matematika',
    hadir: 32,
    tidakHadir: 0,
    keterangan: '-',
  },
  {
    id: 4,
    tanggal: '21 April 2026',
    kelas: 'XI-B',
    mapel: 'Matematika',
    hadir: 31,
    tidakHadir: 1,
    keterangan: '1 izin lomba',
  },
];

export default function RekapAbsensiGuruMapel() {
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
      </motion.div>
    </div>
  );
}
