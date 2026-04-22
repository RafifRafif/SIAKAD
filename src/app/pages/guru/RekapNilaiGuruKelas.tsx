'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { FileText, Filter, GraduationCap } from 'lucide-react';
import { EmptyState } from '../../components/dashboard/EmptyState';
import { getCurrentAuthProfile, getGradeEntries, type BackendGradeEntry, type BackendSchoolClass } from '../../lib/guruData';

const jenisOptions = ['Semua Jenis', 'UTS', 'UAS', 'Tugas', 'Quiz'];

export default function RekapNilaiGuruKelas() {
  const [entries, setEntries] = useState<BackendGradeEntry[]>([]);
  const [selectedMapel, setSelectedMapel] = useState('Semua Mata Pelajaran');
  const [selectedJenis, setSelectedJenis] = useState('Semua Jenis');
  const [homeroomClasses, setHomeroomClasses] = useState<BackendSchoolClass[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const profile = await getCurrentAuthProfile();
      const classes = profile?.dashboard_context?.homeroom_classes ?? [];
      setHomeroomClasses(classes);

      const responses = await Promise.all(classes.map((item) => getGradeEntries({ classId: item.id })));
      setEntries(responses.flat());
    };

    void loadData();
  }, []);

  const mapelOptions = useMemo(
    () => ['Semua Mata Pelajaran', ...Array.from(new Set(entries.map((item) => item.subject?.name).filter(Boolean)))],
    [entries]
  );

  const filteredNilai = useMemo(
    () =>
      entries.filter((item) => {
        const matchMapel =
          selectedMapel === 'Semua Mata Pelajaran' || item.subject?.name === selectedMapel;
        const matchJenis = selectedJenis === 'Semua Jenis' || item.assessment_type === selectedJenis;
        return matchMapel && matchJenis;
      }),
    [entries, selectedJenis, selectedMapel]
  );

  const rataRata = useMemo(() => {
    if (filteredNilai.length === 0) return '0.00';
    const total = filteredNilai.reduce((sum, item) => sum + item.score, 0);
    return (total / filteredNilai.length).toFixed(2);
  }, [filteredNilai]);

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

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 inline-flex rounded-lg bg-blue-100 p-3 text-[#2563EB]">
            <GraduationCap size={20} />
          </div>
          <p className="text-sm text-gray-600">Total Data Nilai</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{filteredNilai.length} Entri</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 inline-flex rounded-lg bg-green-100 p-3 text-green-600">
            <FileText size={20} />
          </div>
          <p className="text-sm text-gray-600">Rata-rata Nilai</p>
          <p className="mt-1 text-xl font-bold text-gray-900">{rataRata}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 inline-flex rounded-lg bg-amber-100 p-3 text-amber-600">
            <Filter size={20} />
          </div>
          <p className="text-sm text-gray-600">Filter Aktif</p>
          <p className="mt-1 text-sm font-semibold text-gray-900">
            {selectedMapel} | {selectedJenis}
          </p>
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

        {filteredNilai.length === 0 ? (
          <EmptyState
            message="Belum ada rekap nilai"
            description="Nilai murid dari guru mata pelajaran akan tampil di sini setelah tersedia."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Siswa</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">NIS</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Mata Pelajaran</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Jenis</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Nilai</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Guru</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredNilai.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.student?.name ?? '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{item.student?.nis ?? '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{item.subject?.name ?? '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{item.assessment_type}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{item.score}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">-</td>
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
