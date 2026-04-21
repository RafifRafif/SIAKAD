'use client';

import { motion } from 'motion/react';
import { BellRing, CalendarDays, ClipboardList } from 'lucide-react';

const rekapPresensi = [
  {
    id: 1,
    nama: 'Ahmad Fauzi',
    nis: '2024001',
    mapel: 'Matematika',
    tanggal: '2026-04-20',
    status: 'Hadir',
    keterangan: '-',
  },
  {
    id: 2,
    nama: 'Siti Nurhaliza',
    nis: '2024002',
    mapel: 'Matematika',
    tanggal: '2026-04-20',
    status: 'Tidak Hadir',
    keterangan: 'Izin sakit',
  },
  {
    id: 3,
    nama: 'Muhammad Rizki',
    nis: '2024003',
    mapel: 'Bahasa Inggris',
    tanggal: '2026-04-20',
    status: 'Hadir',
    keterangan: '-',
  },
  {
    id: 4,
    nama: 'Fatimah Azzahra',
    nis: '2024004',
    mapel: 'Bahasa Inggris',
    tanggal: '2026-04-20',
    status: 'Tidak Hadir',
    keterangan: 'Keperluan keluarga',
  },
];

export default function MonitoringPresensiKelas() {
  const totalTidakHadir = rekapPresensi.filter((item) => item.status === 'Tidak Hadir').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Monitoring Presensi</h2>
          <p className="mt-1 text-gray-600">
            Pantau presensi murid yang diinput oleh guru mata pelajaran
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-3 text-sm font-medium text-[#2563EB]">
          <ClipboardList size={18} />
          Rekap Harian Kelas
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 inline-flex rounded-lg bg-blue-100 p-3 text-[#2563EB]">
            <CalendarDays size={20} />
          </div>
          <p className="text-sm text-gray-600">Tanggal Monitoring</p>
          <p className="mt-1 text-xl font-bold text-gray-900">20 April 2026</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 inline-flex rounded-lg bg-green-100 p-3 text-green-600">
            <ClipboardList size={20} />
          </div>
          <p className="text-sm text-gray-600">Total Laporan Masuk</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{rekapPresensi.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 inline-flex rounded-lg bg-amber-100 p-3 text-amber-600">
            <BellRing size={20} />
          </div>
          <p className="text-sm text-gray-600">Perlu Tindak Lanjut</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{totalTidakHadir}</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
      >
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="font-semibold text-gray-900">Rekap Presensi Murid</h3>
          <p className="mt-1 text-sm text-gray-600">
            Data ini berasal dari input presensi guru mata pelajaran
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Siswa</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">NIS</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Mata Pelajaran</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Tanggal</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rekapPresensi.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.nama}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{item.nis}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{item.mapel}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{item.tanggal}</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`rounded-full px-3 py-1 font-medium ${
                        item.status === 'Hadir'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {item.status}
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
