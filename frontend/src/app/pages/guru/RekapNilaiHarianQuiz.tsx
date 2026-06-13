'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { BookOpenCheck, Download } from 'lucide-react';
import {
  getGrades,
  monthLabelFromDate,
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

const tugasPenilaianOptions = Array.from({ length: 10 }, (_, index) => `Tugas ${index + 1}`);
const quizPenilaianOptions = Array.from({ length: 10 }, (_, index) => `Quiz ${index + 1}`);
const jenisPenilaianOptions = [...tugasPenilaianOptions, ...quizPenilaianOptions];

const average = (values: Array<number | null | undefined>) => {
  const validValues = values.filter((value): value is number => typeof value === 'number');

  return validValues.length > 0
    ? validValues.reduce((total, value) => total + value, 0) / validValues.length
    : null;
};

const formatAverage = (value: number | null) => value === null ? '-' : value.toFixed(2);

export default function RekapNilaiHarianQuiz() {
  const [grades, setGrades] = useState<StudentGradeItem[]>([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [selectedMataPelajaran, setSelectedMataPelajaran] = useState('');
  const [selectedBulan, setSelectedBulan] = useState('');
  const [gradeRanges, setGradeRanges] = useState<GradeRangeItem[]>(
    defaultBobotPenilaianConfig.gradeRanges
  );

  useEffect(() => {
    void Promise.all([
      getGrades(),
      apiGet<BobotPenilaianConfig>('/api/assessment-setting'),
    ])
      .then(([gradeItems, config]) => {
        setGrades(gradeItems.filter((item) => jenisPenilaianOptions.includes(item.jenis)));
        setGradeRanges(config.gradeRanges);
      })
      .catch(() => {
        setGrades([]);
      });
  }, []);

  const kelasOptions = useMemo(
    () => uniqueValues(grades.map((grade) => grade.kelas)),
    [grades]
  );
  const mataPelajaranOptions = useMemo(
    () =>
      selectedKelas
        ? uniqueValues(
            grades
              .filter((grade) => grade.kelas === selectedKelas)
              .map((grade) => grade.mapel)
          )
        : [],
    [grades, selectedKelas]
  );
  const bulanOptions = useMemo(
    () => uniqueValues(grades.map((grade) => monthLabelFromDate(grade.tanggal))),
    [grades]
  );
  const hasSelectedFilters = Boolean(selectedKelas && selectedMataPelajaran && selectedBulan);

  const rekapNilaiSiswa = useMemo(() => {
    const filteredGrades = hasSelectedFilters
      ? grades.filter((grade) => (
          grade.kelas === selectedKelas &&
          grade.mapel === selectedMataPelajaran &&
          monthLabelFromDate(grade.tanggal) === selectedBulan
        ))
      : [];
    const grouped = new Map<
      string,
      {
        id: string;
        nis: string;
        nama: string;
        nilai: Partial<Record<string, number>>;
      }
    >();

    filteredGrades.forEach((grade) => {
      const existing = grouped.get(grade.nis) ?? {
        id: grade.nis,
        nis: grade.nis,
        nama: grade.nama,
        nilai: {},
      };

      existing.nilai[grade.jenis] = grade.nilai;
      grouped.set(grade.nis, existing);
    });

    return Array.from(grouped.values()).map((item) => {
      const rataTugas = average(tugasPenilaianOptions.map((jenis) => item.nilai[jenis]));
      const rataQuiz = average(quizPenilaianOptions.map((jenis) => item.nilai[jenis]));
      const rataHarian = average([rataTugas, rataQuiz]);

      return {
        ...item,
        rataTugas,
        rataQuiz,
        rataHarian,
        grade: rataHarian === null ? '-' : getGradeLabel(rataHarian, gradeRanges),
      };
    });
  }, [gradeRanges, grades, hasSelectedFilters, selectedBulan, selectedKelas, selectedMataPelajaran]);

  const rataTugasKelas = average(rekapNilaiSiswa.map((item) => item.rataTugas));
  const rataQuizKelas = average(rekapNilaiSiswa.map((item) => item.rataQuiz));
  const rataHarianKelas = average(rekapNilaiSiswa.map((item) => item.rataHarian));

  const handleDownloadExcel = () => {
    if (!hasSelectedFilters || rekapNilaiSiswa.length === 0) {
      return;
    }

    const headers = [
      'No',
      'NIS',
      'Nama Siswa',
      'Jenis',
      ...Array.from({ length: 10 }, (_, index) => `Nilai ${index + 1}`),
      'Rata-rata',
      'Rata-rata Harian',
      'Grade',
    ];
    const rows = rekapNilaiSiswa.flatMap((item, index) => [
      [
        String(index + 1),
        item.nis,
        item.nama,
        'Tugas',
        ...tugasPenilaianOptions.map((jenis) => item.nilai[jenis] ?? '-'),
        formatAverage(item.rataTugas),
        formatAverage(item.rataHarian),
        item.grade,
      ],
      [
        '',
        '',
        '',
        'Quiz',
        ...quizPenilaianOptions.map((jenis) => item.nilai[jenis] ?? '-'),
        formatAverage(item.rataQuiz),
        formatAverage(item.rataHarian),
        item.grade,
      ],
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
    anchor.download = `rekap-nilai-harian-quiz-${filenamePart(selectedKelas)}-${filenamePart(selectedMataPelajaran)}-${filenamePart(selectedBulan)}.xls`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Nilai Harian dan Quiz</h2>
          <p className="mt-1 text-gray-600">
            Rekap nilai tugas harian dan quiz siswa berdasarkan kelas, mata pelajaran, dan bulan
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={handleDownloadExcel}
            disabled={!hasSelectedFilters || rekapNilaiSiswa.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            <Download size={18} />
            Download Excel
          </button>
          <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-3 text-sm font-medium text-[#2563EB]">
            <BookOpenCheck size={18} />
            Rekap Nilai Kelas
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
      >
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="font-semibold text-gray-900">Filter Rekap Nilai</h3>
          <p className="mt-1 text-sm text-gray-600">
            Pilih filter untuk menampilkan rekap Tugas 1-10 dan Quiz 1-10.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Kelas</label>
              <select
                value={selectedKelas}
                onChange={(event) => {
                  setSelectedKelas(event.target.value);
                  setSelectedMataPelajaran('');
                }}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-[#2563EB]"
              >
                <option value="" disabled>Pilih Kelas</option>
                {kelasOptions.map((kelas) => (
                  <option key={kelas} value={kelas}>{kelas}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Mata Pelajaran</label>
              <select
                value={selectedMataPelajaran}
                onChange={(event) => setSelectedMataPelajaran(event.target.value)}
                disabled={!selectedKelas}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-[#2563EB]"
              >
                <option value="" disabled>Pilih Mata Pelajaran</option>
                {mataPelajaranOptions.map((mataPelajaran) => (
                  <option key={mataPelajaran} value={mataPelajaran}>{mataPelajaran}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Bulan</label>
              <select
                value={selectedBulan}
                onChange={(event) => setSelectedBulan(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-[#2563EB]"
              >
                <option value="" disabled>Pilih Bulan</option>
                {bulanOptions.map((bulan) => (
                  <option key={bulan} value={bulan}>{bulan}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid gap-4 border-b border-gray-200 bg-gray-50 px-6 py-4 md:grid-cols-4">
          <div className="rounded-lg bg-white px-4 py-3 shadow-sm">
            <p className="text-sm text-gray-600">Jumlah Siswa</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">{rekapNilaiSiswa.length}</p>
          </div>
          <div className="rounded-lg bg-white px-4 py-3 shadow-sm">
            <p className="text-sm text-gray-600">Rata-rata Tugas</p>
            <p className="mt-1 text-2xl font-bold text-[#2563EB]">{formatAverage(rataTugasKelas)}</p>
          </div>
          <div className="rounded-lg bg-white px-4 py-3 shadow-sm">
            <p className="text-sm text-gray-600">Rata-rata Quiz</p>
            <p className="mt-1 text-2xl font-bold text-[#2563EB]">{formatAverage(rataQuizKelas)}</p>
          </div>
          <div className="rounded-lg bg-white px-4 py-3 shadow-sm">
            <p className="text-sm text-gray-600">Rata-rata Harian</p>
            <p className="mt-1 text-2xl font-bold text-[#2563EB]">{formatAverage(rataHarianKelas)}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1320px]">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="w-16 px-4 py-4 text-center text-xs font-semibold uppercase text-gray-600">No</th>
                <th className="w-32 px-4 py-4 text-left text-xs font-semibold uppercase text-gray-600">NIS</th>
                <th className="w-56 px-4 py-4 text-left text-xs font-semibold uppercase text-gray-600">Nama Siswa</th>
                <th className="w-24 px-3 py-4 text-center text-xs font-semibold uppercase text-gray-600">Jenis</th>
                {Array.from({ length: 10 }, (_, index) => (
                  <th key={index + 1} className="w-24 px-3 py-4 text-center text-xs font-semibold uppercase text-gray-600">
                    Nilai {index + 1}
                  </th>
                ))}
                <th className="w-28 px-3 py-4 text-center text-xs font-semibold uppercase text-gray-600">Rata-rata</th>
                <th className="w-28 px-3 py-4 text-center text-xs font-semibold uppercase text-gray-600">Rata Harian</th>
                <th className="w-24 px-3 py-4 text-center text-xs font-semibold uppercase text-gray-600">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {!hasSelectedFilters && (
                <tr>
                  <td colSpan={17} className="px-4 py-8 text-center text-sm text-gray-500">
                    Pilih kelas, mata pelajaran, dan bulan terlebih dahulu untuk menampilkan rekap nilai.
                  </td>
                </tr>
              )}
              {hasSelectedFilters && rekapNilaiSiswa.length === 0 && (
                <tr>
                  <td colSpan={17} className="px-4 py-8 text-center text-sm text-gray-500">
                    Belum ada nilai harian atau quiz untuk filter yang dipilih.
                  </td>
                </tr>
              )}
              {rekapNilaiSiswa.map((item, index) => (
                <Fragment key={item.id}>
                  <tr className="transition-colors hover:bg-gray-50">
                    <td rowSpan={2} className="border-b border-gray-200 px-4 py-4 text-center text-sm text-gray-700">{index + 1}</td>
                    <td rowSpan={2} className="border-b border-gray-200 px-4 py-4 text-sm font-medium text-gray-900">{item.nis}</td>
                    <td rowSpan={2} className="border-b border-gray-200 px-4 py-4 text-sm font-medium text-gray-900">{item.nama}</td>
                    <td className="px-3 py-4 text-center text-sm font-semibold text-gray-900">Tugas</td>
                    {tugasPenilaianOptions.map((jenis) => (
                      <td key={jenis} className="px-3 py-4 text-center text-sm text-gray-700">{item.nilai[jenis] ?? '-'}</td>
                    ))}
                    <td className="px-3 py-4 text-center text-sm font-bold text-[#2563EB]">{formatAverage(item.rataTugas)}</td>
                    <td rowSpan={2} className="border-b border-gray-200 px-3 py-4 text-center text-sm font-bold text-[#2563EB]">{formatAverage(item.rataHarian)}</td>
                    <td rowSpan={2} className="border-b border-gray-200 px-3 py-4 text-center text-sm font-bold text-gray-900">{item.grade}</td>
                  </tr>
                  <tr className="border-b border-gray-200 transition-colors hover:bg-gray-50">
                    <td className="px-3 py-4 text-center text-sm font-semibold text-gray-900">Quiz</td>
                    {quizPenilaianOptions.map((jenis) => (
                      <td key={jenis} className="px-3 py-4 text-center text-sm text-gray-700">{item.nilai[jenis] ?? '-'}</td>
                    ))}
                    <td className="px-3 py-4 text-center text-sm font-bold text-[#2563EB]">{formatAverage(item.rataQuiz)}</td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
