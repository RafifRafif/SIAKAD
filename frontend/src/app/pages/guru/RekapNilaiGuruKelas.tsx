'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { FileText } from 'lucide-react';
import {
  getGrades,
  uniqueValues,
  type StudentGradeItem,
} from '../../lib/academicActivityStore';

export default function RekapNilaiGuruKelas() {
  const [rekapNilaiData, setRekapNilaiData] = useState<StudentGradeItem[]>([]);
  const [selectedMapel, setSelectedMapel] = useState('Semua Mata Pelajaran');
  const [selectedJenis, setSelectedJenis] = useState('Semua Jenis');

  useEffect(() => {
    void getGrades()
      .then((items) => setRekapNilaiData(dedupeGrades(items)))
      .catch(() => setRekapNilaiData([]));
  }, []);

  const uniqueRekapNilaiData = useMemo(
    () => dedupeGrades(rekapNilaiData),
    [rekapNilaiData]
  );

  const mapelOptions = useMemo(
    () => ['Semua Mata Pelajaran', ...uniqueValues(uniqueRekapNilaiData.map((item) => item.mapel))],
    [uniqueRekapNilaiData]
  );
  const jenisOptions = useMemo(
    () => ['Semua Jenis', ...uniqueValues(uniqueRekapNilaiData.map((item) => item.jenis))],
    [uniqueRekapNilaiData]
  );

  const filteredNilai = useMemo(
    () =>
      uniqueRekapNilaiData.filter((item) => {
        const matchMapel =
          selectedMapel === 'Semua Mata Pelajaran' || item.mapel === selectedMapel;
        const matchJenis = selectedJenis === 'Semua Jenis' || item.jenis === selectedJenis;
        return matchMapel && matchJenis;
      }),
    [uniqueRekapNilaiData, selectedMapel, selectedJenis]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rekap Nilai</h2>
          <p className="mt-1 text-gray-600">
            Pantau nilai semua mata pelajaran yang diinput oleh guru mata pelajaran
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-3 text-sm font-medium text-[#2563EB]">
          <FileText size={18} />
          Rekap Nilai Kelas
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Mata Pelajaran</label>
            <select
              value={selectedMapel}
              onChange={(e) => setSelectedMapel(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              {mapelOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Jenis Penilaian</label>
            <select
              value={selectedJenis}
              onChange={(e) => setSelectedJenis(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              {jenisOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
      >
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="font-semibold text-gray-900">Daftar Rekap Nilai Murid</h3>
          <p className="mt-1 text-sm text-gray-600">
            Menampilkan nilai semua mapel sesuai filter yang dipilih
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px]">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">NIS</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Nama Siswa</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Mata Pelajaran</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Jenis Penilaian</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Guru Mapel</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Nilai</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredNilai.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-700">{item.nis}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.nama}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{item.mapel}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{item.jenis}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{item.guru ?? '-'}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{item.nilai}</td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`rounded-full px-3 py-1 font-medium ${
                        item.grade === 'A'
                          ? 'bg-green-100 text-green-700'
                          : item.grade === 'B'
                          ? 'bg-blue-100 text-blue-700'
                          : item.grade === 'C'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {item.grade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

const gradeKey = (item: StudentGradeItem) =>
  `${item.nis}|${item.mapel}|${item.jenis}|${item.tanggal ?? ''}`;

const dedupeGrades = (items: StudentGradeItem[]) => {
  const uniqueItems = new Map<string, StudentGradeItem>();

  items.forEach((item) => {
    const key = gradeKey(item);

    if (!uniqueItems.has(key)) {
      uniqueItems.set(key, item);
    }
  });

  return Array.from(uniqueItems.values());
};
