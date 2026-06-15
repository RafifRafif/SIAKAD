'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { FileText } from 'lucide-react';
import {
  getGrades,
  uniqueValues,
  type StudentGradeItem,
} from '../../lib/academicActivityStore';

type JenisPenilaian = 'Tugas' | 'Quiz' | 'UTS' | 'UAS';

const jenisPenilaianColumns: JenisPenilaian[] = ['Tugas', 'Quiz', 'UTS', 'UAS'];

interface RekapNilaiMurid {
  id: string;
  nis: string;
  nama: string;
  mapel: string;
  guru?: string | null;
  nilai: Partial<Record<JenisPenilaian, number>>;
  rataRata: number | null;
  grade: string | null;
}

export default function RekapNilaiGuruKelas() {
  const [rekapNilaiData, setRekapNilaiData] = useState<StudentGradeItem[]>([]);
  const [selectedMapel, setSelectedMapel] = useState('Semua Mata Pelajaran');

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

  const filteredNilai = useMemo(
    () =>
      uniqueRekapNilaiData.filter((item) => {
        const matchMapel =
          selectedMapel === 'Semua Mata Pelajaran' || item.mapel === selectedMapel;
        return matchMapel;
      }),
    [uniqueRekapNilaiData, selectedMapel]
  );

  const rekapRows = useMemo<RekapNilaiMurid[]>(() => {
    const grouped = new Map<string, RekapNilaiMurid>();

    filteredNilai.forEach((item) => {
      const key = `${item.nis}|${item.mapel}|${item.tanggal ?? ''}`;
      const existing =
        grouped.get(key) ??
        {
          id: key,
          nis: item.nis,
          nama: item.nama,
          mapel: item.mapel,
          guru: item.guru,
          nilai: {},
          rataRata: null,
          grade: null,
        };
      const jenis = normalizeJenisPenilaian(item.jenis);

      if (jenis) {
        existing.nilai[jenis] = item.nilai;
      }

      grouped.set(key, existing);
    });

    return Array.from(grouped.values()).map((row) => {
      const nilaiTerisi = jenisPenilaianColumns
        .map((jenis) => row.nilai[jenis])
        .filter((nilai): nilai is number => typeof nilai === 'number');
      const rataRata =
        nilaiTerisi.length > 0
          ? nilaiTerisi.reduce((total, nilai) => total + nilai, 0) / nilaiTerisi.length
          : null;

      return {
        ...row,
        rataRata: rataRata === null ? null : Number(rataRata.toFixed(2)),
        grade: rataRata === null ? null : gradeFromAverage(rataRata),
      };
    });
  }, [filteredNilai]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
        <div className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-3 text-sm font-medium text-[#2563EB]">
          <FileText size={18} />
          Rekap Nilai Kelas
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-1">
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
          <table className="w-full min-w-[1080px]">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">NIS</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Nama Siswa</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Mata Pelajaran</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Guru Mapel</th>
                {jenisPenilaianColumns.map((jenis) => (
                  <th key={jenis} className="px-6 py-4 text-center text-xs font-semibold uppercase text-gray-600">
                    {jenis}
                  </th>
                ))}
                <th className="px-6 py-4 text-center text-xs font-semibold uppercase text-gray-600">Rata-rata</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {rekapRows.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-700">{item.nis}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.nama}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{item.mapel}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{item.guru ?? '-'}</td>
                  {jenisPenilaianColumns.map((jenis) => (
                    <td key={jenis} className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                      {item.nilai[jenis] ?? '-'}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    {item.rataRata ?? '-'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {item.grade ? (
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
                    ) : (
                      '-'
                    )}
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

const normalizeJenisPenilaian = (jenis: string): JenisPenilaian | null => {
  const normalized = jenis.toLowerCase();

  if (normalized === 'tugas') return 'Tugas';
  if (normalized === 'quiz') return 'Quiz';
  if (normalized === 'uts') return 'UTS';
  if (normalized === 'uas') return 'UAS';

  return null;
};

const gradeFromAverage = (average: number) =>
  average >= 90 ? 'A' : average >= 80 ? 'B' : average >= 70 ? 'C' : average >= 60 ? 'D' : 'E';

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
