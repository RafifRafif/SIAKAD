'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ClipboardList, Download } from 'lucide-react';
import {
  getAttendanceRecords,
  monthLabelFromDate,
  uniqueValues,
  type AttendanceRecordItem,
} from '../../lib/academicActivityStore';

type StatusHarian = 'H' | 'A' | 'S' | 'I' | '-';

const tanggalPresensi = Array.from({ length: 31 }, (_, index) =>
  String(index + 1).padStart(2, '0')
);

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

const dayFromDate = (value?: string | null) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return String(date.getDate()).padStart(2, '0');
};

export default function MonitoringPresensiKelas() {
  const [records, setRecords] = useState<AttendanceRecordItem[]>([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [selectedMataPelajaran, setSelectedMataPelajaran] = useState('');
  const [selectedBulan, setSelectedBulan] = useState('');

  useEffect(() => {
    void getAttendanceRecords()
      .then(setRecords)
      .catch(() => setRecords([]));
  }, []);

  const kelasOptions = useMemo(
    () => uniqueValues(records.map((record) => record.kelas)),
    [records]
  );
  const mataPelajaranOptions = useMemo(
    () =>
      selectedKelas
        ? uniqueValues(
            records
              .filter((record) => record.kelas === selectedKelas)
              .map((record) => record.mapel)
          )
        : [],
    [records, selectedKelas]
  );
  const bulanOptions = useMemo(
    () => uniqueValues(records.map((record) => monthLabelFromDate(record.tanggal))),
    [records]
  );

  const hasSelectedFilters = Boolean(selectedKelas && selectedMataPelajaran && selectedBulan);

  const daftarPresensiSiswa = useMemo(() => {
    const filteredRecords = hasSelectedFilters
      ? records.filter((record) => {
          const matchKelas = record.kelas === selectedKelas;
          const matchMapel = record.mapel === selectedMataPelajaran;
          const matchBulan = monthLabelFromDate(record.tanggal) === selectedBulan;

          return matchKelas && matchMapel && matchBulan;
        })
      : [];
    const grouped = new Map<
      string,
      {
        id: string;
        siswaId: string;
        nama: string;
        presensi: Partial<Record<string, StatusHarian>>;
      }
    >();

    filteredRecords.forEach((record) => {
      const existing =
        grouped.get(record.nis) ??
        {
          id: record.nis,
          siswaId: record.nis,
          nama: record.nama,
          presensi: {},
        };
      const day = dayFromDate(record.tanggal);

      if (day) {
        existing.presensi[day] = record.statusCode;
      }

      grouped.set(record.nis, existing);
    });

    return Array.from(grouped.values());
  }, [hasSelectedFilters, records, selectedBulan, selectedKelas, selectedMataPelajaran]);

  const statusTerisi = daftarPresensiSiswa.flatMap((item) => Object.values(item.presensi));
  const totalHadir = statusTerisi.filter((status) => status === 'H').length;
  const totalAlpha = statusTerisi.filter((status) => status === 'A').length;
  const totalSakit = statusTerisi.filter((status) => status === 'S').length;
  const totalIzin = statusTerisi.filter((status) => status === 'I').length;

  const handleDownloadExcel = () => {
    if (!hasSelectedFilters || daftarPresensiSiswa.length === 0) {
      return;
    }

    const headers = [
      'No',
      'NIS',
      'Nama Siswa',
      ...tanggalPresensi,
      'Total Hadir',
      'Total Alpha',
      'Total Sakit',
      'Total Izin',
    ];
    const rows = daftarPresensiSiswa.map((item, index) => [
      String(index + 1),
      item.siswaId,
      item.nama,
      ...tanggalPresensi.map((tanggal) => item.presensi[tanggal] ?? '-'),
      String(countStatus(item.presensi, 'H')),
      String(countStatus(item.presensi, 'A')),
      String(countStatus(item.presensi, 'S')),
      String(countStatus(item.presensi, 'I')),
    ]);
    const content = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join('\t'))
      .join('\n');
    const blob = new Blob([content], {
      type: 'application/vnd.ms-excel;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const filenamePart = (value: string) => value.replace(/[^a-z0-9-]+/gi, '-').replace(/^-|-$/g, '');

    anchor.href = url;
    anchor.download = `rekap-presensi-${filenamePart(selectedKelas)}-${filenamePart(selectedMataPelajaran)}-${filenamePart(selectedBulan)}.xls`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Monitoring Presensi</h2>
          <p className="mt-1 text-gray-600">
            Pantau presensi murid yang diinput oleh guru mata pelajaran
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleDownloadExcel}
            disabled={!hasSelectedFilters || daftarPresensiSiswa.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            <Download size={18} />
            Download Excel
          </button>
          <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-3 text-sm font-medium text-[#2563EB]">
            <ClipboardList size={18} />
            Rekap Harian Kelas
          </div>
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
            H = Hadir, A = Alpha, S = Sakit, I = Izin, dan - = belum ada data
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Kelas
              </label>
              <select
                value={selectedKelas}
                onChange={(event) => {
                  setSelectedKelas(event.target.value);
                  setSelectedMataPelajaran('');
                }}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-[#2563EB]"
              >
                <option value="" disabled>
                  Pilih Kelas
                </option>
                {kelasOptions.map((kelas) => (
                  <option key={kelas} value={kelas}>
                    {kelas}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Mata Pelajaran
              </label>
              <select
                value={selectedMataPelajaran}
                onChange={(event) => setSelectedMataPelajaran(event.target.value)}
                disabled={!selectedKelas}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-[#2563EB]"
              >
                <option value="" disabled>
                  Pilih Mata Pelajaran
                </option>
                {mataPelajaranOptions.map((mataPelajaran) => (
                  <option key={mataPelajaran} value={mataPelajaran}>
                    {mataPelajaran}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Bulan
              </label>
              <select
                value={selectedBulan}
                onChange={(event) => setSelectedBulan(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-[#2563EB]"
              >
                <option value="" disabled>
                  Pilih Bulan
                </option>
                {bulanOptions.map((bulan) => (
                  <option key={bulan} value={bulan}>
                    {bulan}
                  </option>
                ))}
              </select>
            </div>
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
              {!hasSelectedFilters && (
                <tr>
                  <td
                    colSpan={3 + tanggalPresensi.length + 4}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    Pilih kelas, mata pelajaran, dan bulan terlebih dahulu untuk menampilkan rekap presensi.
                  </td>
                </tr>
              )}
              {hasSelectedFilters && daftarPresensiSiswa.length === 0 && (
                <tr>
                  <td
                    colSpan={3 + tanggalPresensi.length + 4}
                    className="px-4 py-8 text-center text-sm text-gray-500"
                  >
                    Belum ada data presensi untuk filter yang dipilih.
                  </td>
                </tr>
              )}
              {daftarPresensiSiswa.map((item, index) => (
                <tr key={item.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-4 py-4 text-center text-sm text-gray-700">{index + 1}</td>
                  <td className="px-4 py-4 text-sm font-medium text-gray-900">{item.siswaId}</td>
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
