'use client';

import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ClipboardList } from 'lucide-react';

type StatusHarian = 'H' | 'A' | 'S' | 'I' | '-';

const tanggalPresensi = Array.from({ length: 30 }, (_, index) =>
  String(index + 1).padStart(2, '0')
);

const bulanOptions = ['April 2026', 'Mei 2026', 'Juni 2026'];
const mataPelajaranAktif = 'Matematika';

const daftarSiswa: Array<{
  id: number;
  nis: string;
  nama: string;
  rekapPresensi: Record<string, Partial<Record<string, StatusHarian>>>;
}> = [
  {
    id: 1,
    nis: '2024001',
    nama: 'Ahmad Fauzi',
    rekapPresensi: {
      'April 2026': {
        '01': 'H',
        '02': 'H',
        '03': 'H',
        '04': 'I',
        '05': 'H',
        '08': 'H',
        '09': 'H',
        '10': 'S',
      },
      'Mei 2026': {
        '01': 'H',
        '02': 'H',
        '04': 'S',
        '05': 'H',
        '06': 'H',
      },
    },
  },
  {
    id: 2,
    nis: '2024002',
    nama: 'Siti Nurhaliza',
    rekapPresensi: {
      'April 2026': {
        '01': 'H',
        '02': 'S',
        '03': 'S',
        '04': 'H',
        '05': 'H',
        '08': 'H',
        '09': 'I',
        '10': 'H',
      },
      'Mei 2026': {
        '01': 'H',
        '02': 'H',
        '04': 'H',
        '05': 'I',
        '06': 'H',
      },
    },
  },
  {
    id: 3,
    nis: '2024003',
    nama: 'Muhammad Rizki',
    rekapPresensi: {
      'April 2026': {
        '01': 'H',
        '02': 'H',
        '03': 'A',
        '04': 'H',
        '05': 'H',
        '08': 'H',
        '09': 'H',
        '10': 'H',
      },
      'Mei 2026': {
        '01': 'H',
        '02': 'A',
        '04': 'H',
        '05': 'H',
        '06': 'H',
      },
    },
  },
  {
    id: 4,
    nis: '2024004',
    nama: 'Fatimah Azzahra',
    rekapPresensi: {
      'April 2026': {
        '01': 'H',
        '02': 'H',
        '03': 'H',
        '04': 'H',
        '05': 'I',
        '08': 'H',
        '09': 'H',
        '10': 'H',
      },
      'Mei 2026': {
        '01': 'H',
        '02': 'H',
        '04': 'H',
        '05': 'H',
        '06': 'S',
      },
    },
  },
];

const statusStyles: Record<StatusHarian, string> = {
  H: 'bg-green-50 text-green-700 ring-green-200',
  A: 'bg-red-50 text-red-700 ring-red-200',
  S: 'bg-amber-50 text-amber-700 ring-amber-200',
  I: 'bg-blue-50 text-blue-700 ring-blue-200',
  '-': 'bg-gray-50 text-gray-400 ring-gray-200',
};

const statusLabels: Record<Exclude<StatusHarian, '-'>, string> = {
  H: 'Hadir',
  A: 'Alpha',
  S: 'Sakit',
  I: 'Izin',
};

const countStatus = (
  presensi: Partial<Record<string, StatusHarian>>,
  statusToCount: Exclude<StatusHarian, '-'>
) => Object.values(presensi).filter((status) => status === statusToCount).length;

export default function RekapAbsensiGuruMapel() {
  const [selectedBulan, setSelectedBulan] = useState(bulanOptions[0]);
  const daftarPresensiSiswa = useMemo(
    () =>
      daftarSiswa.map((siswa) => ({
        id: siswa.id,
        nis: siswa.nis,
        nama: siswa.nama,
        presensi: siswa.rekapPresensi[selectedBulan] ?? {},
      })),
    [selectedBulan]
  );
  const statusTerisi = daftarPresensiSiswa.flatMap((item) => Object.values(item.presensi));
  const totalHadir = statusTerisi.filter((status) => status === 'H').length;
  const totalAlpha = statusTerisi.filter((status) => status === 'A').length;
  const totalSakit = statusTerisi.filter((status) => status === 'S').length;
  const totalIzin = statusTerisi.filter((status) => status === 'I').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rekap Absensi</h2>
          <p className="mt-1 text-gray-600">
            Lihat rangkuman presensi siswa untuk mata pelajaran yang diampu
          </p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
      >
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Rekap Presensi Murid</h3>
              <p className="mt-1 text-sm text-gray-600">
                H = Hadir, A = Alpha, S = Sakit, I = Izin, dan - = belum ada data
              </p>
            </div>
            <span className="inline-flex w-fit rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
              {mataPelajaranAktif}
            </span>
          </div>

          <div className="mt-4 max-w-xs">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Bulan
            </label>
            <select
              value={selectedBulan}
              onChange={(event) => setSelectedBulan(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-[#2563EB]"
            >
              {bulanOptions.map((bulan) => (
                <option key={bulan} value={bulan}>
                  {bulan}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px]">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="w-16 px-4 py-4 text-center text-xs font-semibold uppercase text-gray-600">No</th>
                <th className="w-32 px-4 py-4 text-left text-xs font-semibold uppercase text-gray-600">NIS</th>
                <th className="w-56 px-4 py-4 text-left text-xs font-semibold uppercase text-gray-600">Nama Siswa</th>
                {tanggalPresensi.map((tanggal) => (
                  <th
                    key={tanggal}
                    className="w-12 px-2 py-4 text-center text-xs font-semibold uppercase text-gray-600"
                  >
                    {tanggal}
                  </th>
                ))}
                <th className="w-20 px-3 py-4 text-center text-xs font-semibold uppercase text-gray-600">Total Hadir</th>
                <th className="w-20 px-3 py-4 text-center text-xs font-semibold uppercase text-gray-600">Total Alpha</th>
                <th className="w-20 px-3 py-4 text-center text-xs font-semibold uppercase text-gray-600">Total Sakit</th>
                <th className="w-20 px-3 py-4 text-center text-xs font-semibold uppercase text-gray-600">Total Izin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {daftarPresensiSiswa.map((item, index) => (
                <tr key={item.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-4 py-4 text-center text-sm text-gray-700">{index + 1}</td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">{item.nis}</td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">{item.nama}</td>
                  {tanggalPresensi.map((tanggal) => {
                    const status = item.presensi[tanggal] ?? '-';

                    return (
                      <td key={tanggal} className="px-2 py-3 text-center">
                        <span
                          title={status === '-' ? 'Belum ada data' : statusLabels[status]}
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold ring-1 ${statusStyles[status]}`}
                        >
                          {status}
                        </span>
                      </td>
                    );
                  })}
                  <td className="px-3 py-4 text-center text-sm font-semibold text-green-700">
                    {countStatus(item.presensi, 'H')}
                  </td>
                  <td className="px-3 py-4 text-center text-sm font-semibold text-red-700">
                    {countStatus(item.presensi, 'A')}
                  </td>
                  <td className="px-3 py-4 text-center text-sm font-semibold text-amber-700">
                    {countStatus(item.presensi, 'S')}
                  </td>
                  <td className="px-3 py-4 text-center text-sm font-semibold text-blue-700">
                    {countStatus(item.presensi, 'I')}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-gray-200 bg-gray-50">
              <tr>
                <td colSpan={3 + tanggalPresensi.length} className="px-4 py-4 text-right text-sm font-semibold text-gray-900">
                  Total Keseluruhan
                </td>
                <td className="px-3 py-4 text-center text-sm font-bold text-green-700">{totalHadir}</td>
                <td className="px-3 py-4 text-center text-sm font-bold text-red-700">{totalAlpha}</td>
                <td className="px-3 py-4 text-center text-sm font-bold text-amber-700">{totalSakit}</td>
                <td className="px-3 py-4 text-center text-sm font-bold text-blue-700">{totalIzin}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
