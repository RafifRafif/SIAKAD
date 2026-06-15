'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { FileText } from 'lucide-react';
import {
  getGrades,
  uniqueValues,
  type StudentGradeItem,
} from '../../lib/academicActivityStore';
import {
  defaultBobotPenilaianConfig,
  getGradeLabel,
  type BobotPenilaianConfig,
  type GradeRangeItem,
} from '../../lib/bobotPenilaianStore';
import { apiGet } from '../../lib/apiClient';

type JenisNilaiAkhir = 'Tugas' | 'Quiz' | 'UTS' | 'UAS';

const jenisNilaiAkhirColumns: JenisNilaiAkhir[] = ['Tugas', 'Quiz', 'UTS', 'UAS'];

interface RekapNilaiAkhirRow {
  id: string;
  nis: string;
  nama: string;
  kelas: string;
  mapel: string;
  guru?: string | null;
  tanggal?: string | null;
  nilai: Partial<Record<JenisNilaiAkhir, number>>;
  rataRata: number | null;
  grade: string;
}

const normalizeJenisNilaiAkhir = (jenis: string): JenisNilaiAkhir | null => {
  const normalized = jenis.toLowerCase();

  if (normalized === 'tugas') return 'Tugas';
  if (normalized === 'quiz') return 'Quiz';
  if (normalized === 'uts') return 'UTS';
  if (normalized === 'uas') return 'UAS';

  return null;
};

const average = (values: Array<number | null | undefined>) => {
  const validValues = values.filter((value): value is number => typeof value === 'number');

  return validValues.length > 0
    ? validValues.reduce((total, value) => total + value, 0) / validValues.length
    : null;
};

const formatAverage = (value: number | null) => value === null ? '-' : value.toFixed(2);

export default function RekapNilaiAkhir() {
  const [grades, setGrades] = useState<StudentGradeItem[]>([]);
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState('');
  const [selectedKelas, setSelectedKelas] = useState('');
  const [selectedMataPelajaran, setSelectedMataPelajaran] = useState('');
  const [gradeRanges, setGradeRanges] = useState<GradeRangeItem[]>(
    defaultBobotPenilaianConfig.gradeRanges
  );

  useEffect(() => {
    void Promise.all([
      getGrades(),
      apiGet<BobotPenilaianConfig>('/api/assessment-setting'),
    ])
      .then(([gradeItems, config]) => {
        setGrades(gradeItems.filter((item) => normalizeJenisNilaiAkhir(item.jenis)));
        setGradeRanges(config.gradeRanges);
      })
      .catch(() => setGrades([]));
  }, []);

  const kelasOptions = useMemo(
    () =>
      selectedTahunAjaran
        ? uniqueValues(
            grades
              .filter((grade) => grade.tahunAjaran === selectedTahunAjaran)
              .map((grade) => grade.kelas)
          )
        : [],
    [grades, selectedTahunAjaran]
  );

  const tahunAjaranOptions = useMemo(
    () => uniqueValues(grades.map((grade) => grade.tahunAjaran)),
    [grades]
  );

  const mataPelajaranOptions = useMemo(
    () =>
      selectedTahunAjaran && selectedKelas
        ? uniqueValues(
            grades
              .filter((grade) => (
                grade.tahunAjaran === selectedTahunAjaran &&
                grade.kelas === selectedKelas
              ))
              .map((grade) => grade.mapel)
          )
        : [],
    [grades, selectedKelas, selectedTahunAjaran]
  );

  const hasSelectedFilters = Boolean(selectedTahunAjaran && selectedKelas && selectedMataPelajaran);

  const rekapNilaiAkhir = useMemo<RekapNilaiAkhirRow[]>(() => {
    const filteredGrades = hasSelectedFilters
      ? grades.filter((grade) => (
          grade.tahunAjaran === selectedTahunAjaran &&
          grade.kelas === selectedKelas &&
          grade.mapel === selectedMataPelajaran
        ))
      : [];
    const grouped = new Map<string, RekapNilaiAkhirRow>();

    filteredGrades.forEach((grade) => {
      const jenis = normalizeJenisNilaiAkhir(grade.jenis);

      if (!jenis) {
        return;
      }

      const existing = grouped.get(grade.nis) ?? {
        id: grade.nis,
        nis: grade.nis,
        nama: grade.nama,
        kelas: grade.kelas,
        mapel: grade.mapel,
        guru: grade.guru,
        tanggal: grade.tanggal,
        nilai: {},
        rataRata: null,
        grade: '-',
      };

      existing.nilai[jenis] = grade.nilai;
      existing.tanggal = grade.tanggal ?? existing.tanggal;
      existing.guru = grade.guru ?? existing.guru;
      grouped.set(grade.nis, existing);
    });

    return Array.from(grouped.values()).map((row) => {
      const rataRata = average(jenisNilaiAkhirColumns.map((jenis) => row.nilai[jenis]));

      return {
        ...row,
        rataRata,
        grade: rataRata === null ? '-' : getGradeLabel(rataRata, gradeRanges),
      };
    });
  }, [gradeRanges, grades, hasSelectedFilters, selectedKelas, selectedMataPelajaran, selectedTahunAjaran]);

  const rataRataKelas = average(rekapNilaiAkhir.map((item) => item.rataRata));

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
      >
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="font-semibold text-gray-900">Filter Rekap Nilai Akhir</h3>
          <p className="mt-1 text-sm text-gray-600">
            Pilih tahun ajaran, kelas, dan mata pelajaran untuk melihat nilai akhir siswa.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Tahun Ajaran</label>
              <select
                value={selectedTahunAjaran}
                onChange={(event) => {
                  setSelectedTahunAjaran(event.target.value);
                  setSelectedKelas('');
                  setSelectedMataPelajaran('');
                }}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-[#2563EB]"
              >
                <option value="" disabled>Pilih Tahun Ajaran</option>
                {tahunAjaranOptions.map((tahunAjaran) => (
                  <option key={tahunAjaran} value={tahunAjaran}>
                    {tahunAjaran}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Kelas</label>
              <select
                value={selectedKelas}
                onChange={(event) => {
                  setSelectedKelas(event.target.value);
                  setSelectedMataPelajaran('');
                }}
                disabled={!selectedTahunAjaran}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-[#2563EB] disabled:bg-gray-100"
              >
                <option value="" disabled>Pilih Kelas</option>
                {kelasOptions.map((kelas) => (
                  <option key={kelas} value={kelas}>
                    {kelas}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Mata Pelajaran</label>
              <select
                value={selectedMataPelajaran}
                onChange={(event) => setSelectedMataPelajaran(event.target.value)}
                disabled={!selectedTahunAjaran || !selectedKelas}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-[#2563EB] disabled:bg-gray-100"
              >
                <option value="" disabled>Pilih Mata Pelajaran</option>
                {mataPelajaranOptions.map((mapel) => (
                  <option key={mapel} value={mapel}>
                    {mapel}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
      >
        <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Daftar Rekap Nilai Akhir</h3>
            <p className="mt-1 text-sm text-gray-600">
              Nilai yang tampil berasal dari fitur Input Nilai Akhir.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm font-medium text-gray-600">
            <FileText size={16} />
            {selectedMataPelajaran || '-'}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">No</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">NIS</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Nama Siswa</th>
                {jenisNilaiAkhirColumns.map((jenis) => (
                  <th key={jenis} className="px-6 py-4 text-center text-xs font-semibold uppercase text-gray-600">
                    {jenis}
                  </th>
                ))}
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase text-gray-600">Rata-rata</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {!hasSelectedFilters && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">
                    Pilih tahun ajaran, kelas, dan mata pelajaran terlebih dahulu untuk menampilkan rekap nilai akhir.
                  </td>
                </tr>
              )}
              {hasSelectedFilters && rekapNilaiAkhir.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">
                    Belum ada nilai akhir untuk filter yang dipilih.
                  </td>
                </tr>
              )}
              {rekapNilaiAkhir.map((item, index) => (
                <tr key={item.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{index + 1}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{item.nis}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.nama}</td>
                  {jenisNilaiAkhirColumns.map((jenis) => (
                    <td key={jenis} className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                      {item.nilai[jenis] ?? '-'}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    {formatAverage(item.rataRata)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`rounded-full px-3 py-1 font-medium ${
                        item.grade === 'A'
                          ? 'bg-green-100 text-green-700'
                          : item.grade === 'B'
                          ? 'bg-blue-100 text-blue-700'
                          : item.grade === 'C'
                          ? 'bg-yellow-100 text-yellow-700'
                          : item.grade === '-'
                          ? 'bg-gray-100 text-gray-600'
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
