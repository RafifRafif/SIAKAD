'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { motion } from 'motion/react';
import { getAuthSession } from '../../lib/authStore';
import { apiDownload, apiGet } from '../../lib/apiClient';
import { Toast, useToast } from '../../components/dashboard/Toast';
import {
  getGrades,
  type LearningAssignmentItem,
  type StudentGradeItem,
} from '../../lib/academicActivityStore';
import {
  tahunAjaranOptionLabel,
  tahunAjaranOptionValue,
  type TahunAjaranItem,
} from '../../lib/tahunAjaranStore';

interface NilaiMapel {
  mapel: string;
  tahunAjaran: string;
  nilai: {
    tugas: number | null;
    quiz: number | null;
    uts: number | null;
    uas: number | null;
    rata: number;
  };
  grade: string;
}

const gradeFromAverage = (average: number) =>
  average >= 90 ? 'A' : average >= 80 ? 'B' : average >= 70 ? 'C' : average >= 60 ? 'D' : 'E';

export default function NilaiSiswa() {
  const [grades, setGrades] = useState<StudentGradeItem[]>([]);
  const [learningAssignments, setLearningAssignments] = useState<LearningAssignmentItem[]>([]);
  const [tahunAjaranItems, setTahunAjaranItems] = useState<TahunAjaranItem[]>([]);
  const [selectedTahunAjaran, setSelectedTahunAjaran] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    const loadGrades = async () => {
      const session = await getAuthSession();
      const params = session?.username ? { nis: session.username } : {};
      const [items, academicYears, assignmentItems] = await Promise.all([
        getGrades(params),
        apiGet<TahunAjaranItem[]>('/api/academic-years'),
        apiGet<LearningAssignmentItem[]>('/api/learning-assignments'),
      ]);

      setGrades(items);
      setTahunAjaranItems(academicYears);
      setLearningAssignments(assignmentItems);
    };

    void loadGrades().catch(() => {
      setGrades([]);
      setTahunAjaranItems([]);
      setLearningAssignments([]);
    });
  }, []);

  const tahunAjaranOptions = useMemo(
    () => {
      const options = tahunAjaranItems
        .map((item) => ({
          value: tahunAjaranOptionValue(item),
          label: tahunAjaranOptionLabel(item),
        }));
      const optionValues = new Set(options.map((item) => item.value));

      grades.forEach((grade) => {
        if (grade.tahunAjaran && !optionValues.has(grade.tahunAjaran)) {
          options.push({
            value: grade.tahunAjaran,
            label: grade.tahunAjaran,
          });
          optionValues.add(grade.tahunAjaran);
        }
      });

      learningAssignments.forEach((assignment) => {
        if (assignment.tahunAjaran && !optionValues.has(assignment.tahunAjaran)) {
          options.push({
            value: assignment.tahunAjaran,
            label: assignment.tahunAjaran,
          });
          optionValues.add(assignment.tahunAjaran);
        }
      });

      return options;
    },
    [grades, learningAssignments, tahunAjaranItems]
  );

  const filteredGrades = useMemo(
    () =>
      selectedTahunAjaran
        ? grades.filter((grade) => grade.tahunAjaran === selectedTahunAjaran)
        : [],
    [grades, selectedTahunAjaran]
  );

  const nilaiData = useMemo<NilaiMapel[]>(() => {
    const grouped = new Map<string, StudentGradeItem[]>();

    filteredGrades.forEach((grade) => {
      const current = grouped.get(grade.mapel) ?? [];
      current.push(grade);
      grouped.set(grade.mapel, current);
    });

    const kelasSiswa = filteredGrades.find((grade) => grade.kelas)?.kelas;
    const mapelNames = new Set<string>();

    learningAssignments
      .filter((assignment) => {
        const matchTahunAjaran = selectedTahunAjaran
          ? assignment.tahunAjaran === selectedTahunAjaran
          : true;
        const matchKelas = kelasSiswa ? assignment.kelas === kelasSiswa : true;

        return matchTahunAjaran && matchKelas;
      })
      .forEach((assignment) => mapelNames.add(assignment.nama));

    grouped.forEach((_, mapel) => mapelNames.add(mapel));

    return Array.from(mapelNames).sort((first, second) => first.localeCompare(second)).map((mapel) => {
      const items = grouped.get(mapel) ?? [];
      const nilaiByJenis = (jenis: string) =>
        items.find((item) => item.jenis.toLowerCase() === jenis)?.nilai ?? null;
      const average =
        items.length > 0
          ? items.reduce((total, item) => total + Number(item.nilai), 0) / items.length
          : null;

      return {
        mapel,
        tahunAjaran: items[0]?.tahunAjaran ?? selectedTahunAjaran,
        nilai: {
          tugas: nilaiByJenis('tugas'),
          quiz: nilaiByJenis('quiz'),
          uts: nilaiByJenis('uts'),
          uas: nilaiByJenis('uas'),
          rata: average === null ? 0 : Number(average.toFixed(2)),
        },
        grade: average === null ? '-' : gradeFromAverage(average),
      };
    });
  }, [filteredGrades, learningAssignments, selectedTahunAjaran]);

  const nilaiTerisi = nilaiData.filter((item) => item.grade !== '-');
  const rataRataTotal =
    nilaiTerisi.length > 0
      ? nilaiTerisi.reduce((sum, item) => sum + item.nilai.rata, 0) / nilaiTerisi.length
      : 0;
  const gradeTotal = nilaiTerisi.length > 0 ? gradeFromAverage(rataRataTotal) : '-';
  const semesterLabel = selectedTahunAjaran || '-';
  const handleDownloadRapor = async () => {
    if (isDownloading) {
      return;
    }

    setIsDownloading(true);

    try {
      const query = selectedTahunAjaran
        ? `?tahunAjaran=${encodeURIComponent(selectedTahunAjaran)}`
        : '';

      await apiDownload(`/api/reports/student/rapor${query}`, 'rapor-siswa.pdf');
      showToast('Rapor berhasil didownload.', 'success');
    } catch {
      showToast('Gagal download rapor. Pastikan Anda sudah login sebagai siswa.', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-4">
        <button
          onClick={handleDownloadRapor}
          disabled={isDownloading}
          className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-all font-medium shadow-md disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          <Download size={20} />
          <span>{isDownloading ? 'Mendownload...' : 'Download Rapor'}</span>
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-[#2563EB] to-blue-600 rounded-xl p-8 text-white shadow-lg">
        <div className="grid sm:grid-cols-3 gap-6">
          <div>
            <label className="mb-2 block text-blue-100">
              Tahun Ajaran
            </label>
            <select
              value={selectedTahunAjaran}
              onChange={(event) => setSelectedTahunAjaran(event.target.value)}
              className="w-full rounded-lg border border-white/30 bg-white px-4 py-2 text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-white/70"
            >
              <option value="" disabled>
                Pilih Tahun Ajaran
              </option>
              {tahunAjaranOptions.map((tahunAjaran) => (
                <option key={tahunAjaran.value} value={tahunAjaran.value}>
                  {tahunAjaran.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-blue-100 mb-2">Rata-rata Keseluruhan</p>
            <p className="text-2xl font-bold">{rataRataTotal.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-blue-100 mb-2">Tahun Ajaran Dipilih</p>
            <p className="text-2xl font-bold">{semesterLabel}</p>
          </div>
        </div>
      </div>

      {/* Nilai Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Daftar Nilai Mata Pelajaran
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Mata Pelajaran
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">
                  Tugas
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">
                  Quiz
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">
                  UTS
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">
                  UAS
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">
                  Rata-rata
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase">
                  Grade
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {!selectedTahunAjaran && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                    Pilih tahun ajaran terlebih dahulu untuk menampilkan nilai.
                  </td>
                </tr>
              )}
              {selectedTahunAjaran && nilaiData.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                    Belum ada mata pelajaran untuk tahun ajaran yang dipilih.
                  </td>
                </tr>
              )}
              {nilaiData.map((item, index) => (
                <motion.tr
                  key={item.mapel}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {item.mapel}
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-900">
                    {item.nilai.tugas ?? '-'}
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-900">
                    {item.nilai.quiz ?? '-'}
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-900">
                    {item.nilai.uts ?? '-'}
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-900">
                    {item.nilai.uas ?? '-'}
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-bold text-gray-900">
                    {item.grade === '-' ? '-' : item.nilai.rata}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-4 py-1 rounded-full font-bold ${
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
                </motion.tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-300">
              <tr>
                <td className="px-6 py-4 text-sm font-bold text-gray-900" colSpan={5}>
                  RATA-RATA KESELURUHAN
                </td>
                <td className="px-6 py-4 text-center text-lg font-bold text-[#2563EB]">
                  {rataRataTotal.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={`px-4 py-1 rounded-full font-bold ${
                      gradeTotal === '-'
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {gradeTotal}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
