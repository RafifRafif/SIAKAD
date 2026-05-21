'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { getAuthSession } from '../../lib/authStore';
import { apiDownload } from '../../lib/apiClient';
import {
  getGrades,
  getStudentInsights,
  type StudentGradeItem,
  type StudentInsights,
} from '../../lib/academicActivityStore';

interface NilaiMapel {
  mapel: string;
  tahunAjaran: string;
  nilai: {
    tugas: number | null;
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
  const [insights, setInsights] = useState<StudentInsights>({
    rank: null,
    classSize: 0,
    notes: [],
    achievements: [],
  });

  useEffect(() => {
    const loadGrades = async () => {
      const session = await getAuthSession();
      const params = session?.username ? { nis: session.username } : {};
      const [items, insightItems] = await Promise.all([
        getGrades(params),
        getStudentInsights(params),
      ]);

      setGrades(items);
      setInsights(insightItems);
    };

    void loadGrades().catch(() => {
      setGrades([]);
      setInsights({ rank: null, classSize: 0, notes: [], achievements: [] });
    });
  }, []);

  const nilaiData = useMemo<NilaiMapel[]>(() => {
    const grouped = new Map<string, StudentGradeItem[]>();

    grades.forEach((grade) => {
      const current = grouped.get(grade.mapel) ?? [];
      current.push(grade);
      grouped.set(grade.mapel, current);
    });

    return Array.from(grouped.entries()).map(([mapel, items]) => {
      const nilaiByJenis = (jenis: string) =>
        items.find((item) => item.jenis.toLowerCase() === jenis)?.nilai ?? null;
      const average =
        items.reduce((total, item) => total + Number(item.nilai), 0) / items.length;

      return {
        mapel,
        tahunAjaran: items[0]?.tahunAjaran ?? '',
        nilai: {
          tugas: nilaiByJenis('tugas'),
          uts: nilaiByJenis('uts'),
          uas: nilaiByJenis('uas'),
          rata: Number(average.toFixed(2)),
        },
        grade: gradeFromAverage(average),
      };
    });
  }, [grades]);

  const rataRataTotal =
    nilaiData.length > 0
      ? nilaiData.reduce((sum, item) => sum + item.nilai.rata, 0) / nilaiData.length
      : 0;
  const gradeTotal = gradeFromAverage(rataRataTotal);
  const semesterLabel = nilaiData[0]?.tahunAjaran || '-';
  const rankLabel = insights.rank ? `${insights.rank}/${insights.classSize}` : '-';
  const latestNote = insights.notes[0];
  const latestAchievement = insights.achievements[0];
  const handleDownloadRapor = () => {
    void apiDownload('/api/reports/student/rapor', 'rapor-siswa.pdf');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Nilai & Rapor</h2>
          <p className="text-gray-600 mt-1">Lihat nilai dan download rapor</p>
        </div>
        <button
          onClick={handleDownloadRapor}
          className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-all font-medium shadow-md"
        >
          <Download size={20} />
          <span>Download Rapor</span>
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-[#2563EB] to-blue-600 rounded-xl p-8 text-white shadow-lg">
        <div className="grid sm:grid-cols-3 gap-6">
          <div>
            <p className="text-blue-100 mb-2">Semester</p>
            <p className="text-2xl font-bold">{semesterLabel}</p>
          </div>
          <div>
            <p className="text-blue-100 mb-2">Rata-rata Keseluruhan</p>
            <p className="text-2xl font-bold">{rataRataTotal.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-blue-100 mb-2">Peringkat Kelas</p>
            <p className="text-2xl font-bold">{rankLabel}</p>
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
                    {item.nilai.uts ?? '-'}
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-900">
                    {item.nilai.uas ?? '-'}
                  </td>
                  <td className="px-6 py-4 text-center text-sm font-bold text-gray-900">
                    {item.nilai.rata}
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
                <td className="px-6 py-4 text-sm font-bold text-gray-900" colSpan={4}>
                  RATA-RATA KESELURUHAN
                </td>
                <td className="px-6 py-4 text-center text-lg font-bold text-[#2563EB]">
                  {rataRataTotal.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="px-4 py-1 bg-green-100 text-green-700 rounded-full font-bold">
                    {gradeTotal}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Additional Info */}
      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <FileText size={24} className="text-[#2563EB]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Catatan Guru</h3>
          </div>
          <p className="text-gray-700 leading-relaxed">
            {latestNote?.catatan ?? 'Belum ada catatan guru dari backend.'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <FileText size={24} className="text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Prestasi</h3>
          </div>
          <p className="text-gray-700">
            {latestAchievement
              ? `${latestAchievement.judul}${latestAchievement.keterangan ? ` - ${latestAchievement.keterangan}` : ''}`
              : 'Belum ada data prestasi dari backend.'}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
