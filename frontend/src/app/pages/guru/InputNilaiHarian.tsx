'use client';

import { type ChangeEvent, useEffect, useMemo, useState } from 'react';
import { Download, Save, Upload, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useToast, Toast } from '../../components/dashboard/Toast';
import { apiGet, apiPost } from '../../lib/apiClient';
import type { LearningAssignmentItem, StudentGradeItem } from '../../lib/academicActivityStore';
import {
  downloadExcelTemplate,
  findImportHeaderRowIndex,
  findStudentByImportKey,
  importKeyVariants,
  normalizeImportHeader,
  parseDelimitedRows,
  parseSpreadsheetRows,
  rowsToCsvText,
} from '../../lib/gradeImport';
import type { KelasItem } from '../../lib/kelasStore';
import type { MasterPelajaran } from '../../lib/pelajaranStore';
import type { StudentItem } from '../../lib/siswaStore';

const tugasPenilaianOptions = [
  'Tugas 1',
  'Tugas 2',
  'Tugas 3',
  'Tugas 4',
  'Tugas 5',
  'Tugas 6',
  'Tugas 7',
  'Tugas 8',
  'Tugas 9',
  'Tugas 10',
] as const;

const quizPenilaianOptions = [
  'Quiz 1',
  'Quiz 2',
  'Quiz 3',
  'Quiz 4',
  'Quiz 5',
  'Quiz 6',
  'Quiz 7',
  'Quiz 8',
  'Quiz 9',
  'Quiz 10',
] as const;

const jenisPenilaianOptions = [...tugasPenilaianOptions, ...quizPenilaianOptions] as const;

type JenisPenilaian = typeof jenisPenilaianOptions[number];

export default function InputNilaiHarian() {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [learningAssignments, setLearningAssignments] = useState<LearningAssignmentItem[]>([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [selectedMapel, setSelectedMapel] = useState('');
  const [tanggalSekarang, setTanggalSekarang] = useState('');
  const [nilai, setNilai] = useState<Record<number, Partial<Record<JenisPenilaian, string>>>>({});
  const [lockedNilai, setLockedNilai] = useState<Record<number, Partial<Record<JenisPenilaian, boolean>>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importContent, setImportContent] = useState('');
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    void apiGet<StudentItem[]>('/api/students')
      .then((items) => {
        setStudents(items);
        setNilai(
          Object.fromEntries(
            items.map((student) => [
              student.id,
              Object.fromEntries(jenisPenilaianOptions.map((jenis) => [jenis, ''])),
            ])
          )
        );
        setLockedNilai(
          Object.fromEntries(
            items.map((student) => [
              student.id,
              Object.fromEntries(jenisPenilaianOptions.map((jenis) => [jenis, false])),
            ])
          )
        );
      })
      .catch(() => showToast('Gagal memuat data siswa dari backend.', 'error'));
  }, []);

  useEffect(() => {
    void apiGet<LearningAssignmentItem[]>('/api/learning-assignments')
      .then(setLearningAssignments)
      .catch(() => showToast('Gagal memuat data pelajaran yang diampu dari backend.', 'error'));
  }, []);

  useEffect(() => {
    if (!selectedKelas || !selectedMapel || students.length === 0) {
      return;
    }

    const query = new URLSearchParams({
      kelas: selectedKelas,
      mapel: selectedMapel,
    });
    const studentByNis = new Map(students.map((student) => [student.nis, student]));

    void apiGet<StudentGradeItem[]>(`/api/grades?${query.toString()}`)
      .then((items) => {
        const nextNilai: Record<number, Partial<Record<JenisPenilaian, string>>> = Object.fromEntries(
          students.map((student) => [
            student.id,
            Object.fromEntries(jenisPenilaianOptions.map((jenis) => [jenis, ''])),
          ])
        );
        const nextLocked: Record<number, Partial<Record<JenisPenilaian, boolean>>> = Object.fromEntries(
          students.map((student) => [
            student.id,
            Object.fromEntries(jenisPenilaianOptions.map((jenis) => [jenis, false])),
          ])
        );

        items.forEach((item) => {
          if (!jenisPenilaianOptions.includes(item.jenis as JenisPenilaian)) {
            return;
          }

          const student = studentByNis.get(item.nis);

          if (!student) {
            return;
          }

          const jenis = item.jenis as JenisPenilaian;

          if (nextLocked[student.id]?.[jenis]) {
            return;
          }

          nextNilai[student.id] = {
            ...nextNilai[student.id],
            [jenis]: String(item.nilai),
          };
          nextLocked[student.id] = {
            ...nextLocked[student.id],
            [jenis]: true,
          };
        });

        setNilai(nextNilai);
        setLockedNilai(nextLocked);
      })
      .catch(() => showToast('Gagal memuat rekap nilai harian dari backend.', 'error'));
  }, [selectedKelas, selectedMapel, students]);

  const kelasOptions = useMemo<KelasItem[]>(
    () =>
      Array.from(
        new Map(
          learningAssignments.map((item) => [
            item.kelas,
            {
              id: item.id,
              nama: item.kelas,
              tahunAjaran: item.tahunAjaran,
              kelompok: item.kelompok,
              waliKelas: '',
              jumlahSiswa: 0,
            },
          ])
        ).values()
      ),
    [learningAssignments]
  );

  const mapelOptions = useMemo<MasterPelajaran[]>(
    () =>
      selectedKelas
        ? Array.from(
            new Map(
              learningAssignments
                .filter((item) => item.kelas === selectedKelas)
                .map((item) => [
                  item.nama,
                  {
                    id: item.id,
                    nama: item.nama,
                    tahunAjaran: item.tahunAjaran,
                  },
                ])
            ).values()
          )
        : [],
    [learningAssignments, selectedKelas]
  );

  const siswaData = useMemo(
    () =>
      selectedKelas && selectedMapel
        ? students.filter((student) => student.kelas === selectedKelas)
        : [],
    [selectedKelas, selectedMapel, students]
  );

  const hasSelectedFilters = Boolean(selectedKelas && selectedMapel);

  const handleNilaiChange = (id: number, jenis: JenisPenilaian, value: string) => {
    if (lockedNilai[id]?.[jenis]) {
      return;
    }

    const numValue = parseInt(value);
    if (value === '' || (numValue >= 0 && numValue <= 100)) {
      setNilai((current) => ({
        ...current,
        [id]: {
          ...current[id],
          [jenis]: value,
        },
      }));
    }
  };

  const handleImportFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    void parseSpreadsheetRows(file)
      .then((rows) => {
        if (rows.length === 0) {
          showToast('File import kosong atau tidak dapat dibaca.', 'error');
          return;
        }

        setImportContent(rowsToCsvText(rows));
      })
      .catch(() => showToast('File import tidak dapat dibaca. Gunakan XLSX, XLS, atau CSV.', 'error'));
  };

  const handleDownloadTemplate = () => {
    if (!hasSelectedFilters || siswaData.length === 0) {
      showToast('Pilih kelas dan mata pelajaran terlebih dahulu untuk mengunduh template.', 'error');
      return;
    }

    downloadExcelTemplate({
      filename: 'TEMPLATE NILAI HARIAN.xlsx',
      title: 'TEMPLATE IMPORT NILAI HARIAN DAN QUIZ',
      description: `Kelas ${selectedKelas} - ${selectedMapel}. Isi nilai angka 0 sampai 100.`,
      sheetName: 'Template Nilai Harian',
      columns: [
        { key: 'nis', label: 'NIS', width: 14 },
        { key: 'nama', label: 'Nama Siswa', width: 24 },
        ...tugasPenilaianOptions.map((item) => ({
          key: item.toLowerCase().replace(/\s+/g, ''),
          label: item,
          width: 12,
        })),
        ...quizPenilaianOptions.map((item) => ({
          key: item.toLowerCase().replace(/\s+/g, ''),
          label: item,
          width: 12,
        })),
      ],
      rows: siswaData.map((student) => ({
        nis: student.nis,
        nama: student.nama,
      })),
    });
  };

  const handleImportNilai = () => {
    if (!hasSelectedFilters) {
      showToast('Pilih kelas dan mata pelajaran terlebih dahulu sebelum import nilai.', 'error');
      return;
    }

    const rows = parseDelimitedRows(importContent);

    if (rows.length < 2) {
      showToast(
        'Format import belum valid. Gunakan header nis,tugas1,...,tugas10,quiz1,...,quiz10.',
        'error'
      );
      return;
    }

    const headerRowIndex = findImportHeaderRowIndex(rows, [
      'nis',
      ...jenisPenilaianOptions.map((jenis) => jenis.toLowerCase().replace(/\s+/g, '')),
    ]);

    if (headerRowIndex === -1) {
      showToast(
        'Header CSV harus berisi nis,tugas1,...,tugas10,quiz1,...,quiz10.',
        'error'
      );
      return;
    }

    const headers = rows[headerRowIndex].map(normalizeImportHeader);
    const nisIndex = headers.indexOf('nis');
    const jenisIndexes = Object.fromEntries(
      jenisPenilaianOptions.map((jenis) => [
        jenis,
        headers.indexOf(jenis.toLowerCase().replace(/\s+/g, '')),
      ])
    ) as Record<JenisPenilaian, number>;

    const availableJenis = jenisPenilaianOptions.filter((jenis) => jenisIndexes[jenis] !== -1);

    if (nisIndex === -1 || availableJenis.length === 0) {
      showToast('Header CSV harus berisi nis dan minimal satu kolom tugas/quiz.', 'error');
      return;
    }

    const siswaByNis = new Map<string, StudentItem>();

    siswaData.forEach((student) => {
      importKeyVariants(student.nis).forEach((key) => {
        siswaByNis.set(key, student);
      });
    });

    let matchedCount = 0;
    let importedCount = 0;
    let invalidCount = 0;
    let lockedCount = 0;
    const importedByStudentId: Record<number, Partial<Record<JenisPenilaian, string>>> = {};

    rows.slice(headerRowIndex + 1).forEach((row) => {
      const student = findStudentByImportKey(siswaByNis, row[nisIndex]);

      if (!student) {
        return;
      }

      matchedCount += 1;

      const importedNilai = availableJenis.reduce<Partial<Record<JenisPenilaian, string>>>(
        (result, jenis) => {
          const value = String(row[jenisIndexes[jenis]] ?? '').trim();

          if (value === '') {
            return result;
          }

          if (lockedNilai[student.id]?.[jenis]) {
            lockedCount += 1;
            return result;
          }

          const numberValue = Number(value);

          if (!Number.isInteger(numberValue) || numberValue < 0 || numberValue > 100) {
            invalidCount += 1;
            return result;
          }

          result[jenis] = String(numberValue);
          return result;
        },
        {}
      );

      if (Object.keys(importedNilai).length > 0) {
        importedCount += 1;
        importedByStudentId[student.id] = {
          ...importedByStudentId[student.id],
          ...importedNilai,
        };
      }
    });

    if (matchedCount === 0) {
      showToast('Tidak ada NIS yang cocok dengan siswa pada kelas ini.', 'error');
      return;
    }

    if (importedCount === 0) {
      showToast(
        lockedCount > 0
          ? 'Nilai yang sudah disimpan tidak dapat diimport ulang.'
          : 'NIS cocok, tetapi belum ada nilai valid yang bisa diimport.',
        'error'
      );
      return;
    }

    setNilai((current) => {
      const next = { ...current };

      Object.entries(importedByStudentId).forEach(([studentId, importedNilai]) => {
        const numericStudentId = Number(studentId);

        next[numericStudentId] = {
          ...next[numericStudentId],
          ...importedNilai,
        };
      });

      return next;
    });

    setIsImportModalOpen(false);
    setImportContent('');
    showToast(
      invalidCount > 0
        ? `Import selesai untuk ${importedCount} siswa. Beberapa nilai tidak valid dilewati.`
        : `Import nilai berhasil untuk ${importedCount} siswa.`,
      'success'
    );
  };

  const handleSubmit = async () => {
    if (isSaving) {
      return;
    }

    if (!selectedKelas || !selectedMapel || !tanggalSekarang) {
      showToast('Pilih kelas, mata pelajaran, dan tanggal terlebih dahulu.', 'error');
      return;
    }

    if (siswaData.length === 0) {
      showToast('Belum ada data siswa dari backend.', 'error');
      return;
    }

    const nilaiSiapSimpan = siswaData.flatMap((student) =>
      jenisPenilaianOptions
        .filter((jenis) => nilai[student.id]?.[jenis] !== '' && !lockedNilai[student.id]?.[jenis])
        .map((jenis) => ({
          student,
          jenis,
          value: Number(nilai[student.id]?.[jenis]),
        }))
    );

    if (nilaiSiapSimpan.length === 0) {
      showToast('Isi minimal satu nilai tugas atau quiz yang belum pernah disimpan.', 'error');
      return;
    }

    setIsSaving(true);

    try {
      await Promise.all(
        nilaiSiapSimpan.map(({ student, jenis, value }) =>
          apiPost('/api/grades', {
            nis: student.nis,
            nama: student.nama,
            kelas: student.kelas,
            tahunAjaran: student.tahunAjaran,
            mapel: selectedMapel,
            jenis,
            nilai: value,
            tanggal: tanggalSekarang,
          })
        )
      );

      setLockedNilai((current) => {
        const next = { ...current };

        nilaiSiapSimpan.forEach(({ student, jenis }) => {
          next[student.id] = {
            ...next[student.id],
            [jenis]: true,
          };
        });

        return next;
      });
      showToast('Nilai berhasil disimpan ke backend!', 'success');
    } catch {
      showToast('Gagal menyimpan nilai ke backend.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const getRataRataSiswa = (
    studentId: number,
    jenisOptions: readonly JenisPenilaian[],
  ) => {
    const validNilai = jenisOptions
      .map((jenis) => nilai[studentId]?.[jenis])
      .filter((item): item is string => Boolean(item))
      .map((item) => parseInt(item));

    if (validNilai.length === 0) return '-';

    return (validNilai.reduce((a, b) => a + b, 0) / validNilai.length).toFixed(2);
  };

  const renderNilaiHarianTable = () => (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900">Input Nilai Harian dan Quiz - {selectedMapel || '-'}</h3>
        <p className="mt-1 text-sm text-gray-600">
          Baris Quiz ditampilkan di bawah baris Tugas untuk setiap siswa.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1540px]">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">
                No
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">
                NIS
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">
                Nama Siswa
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold uppercase text-gray-600">
                Jenis
              </th>
              {Array.from({ length: 10 }, (_, index) => (
                <th
                  key={index + 1}
                  className="px-4 py-4 text-center text-xs font-semibold uppercase text-gray-600"
                >
                  Nilai {index + 1}
                </th>
              ))}
              <th className="px-6 py-4 text-center text-xs font-semibold uppercase text-gray-600">
                Rata-rata Nilai Harian
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold uppercase text-gray-600">
                Rata-rata Nilai Quiz
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {!hasSelectedFilters && (
              <tr>
                <td colSpan={16} className="px-4 py-8 text-center text-sm text-gray-500">
                  Pilih kelas dan mata pelajaran terlebih dahulu untuk menampilkan data nilai.
                </td>
              </tr>
            )}
            {hasSelectedFilters && siswaData.length === 0 && (
              <tr>
                <td colSpan={16} className="px-4 py-8 text-center text-sm text-gray-500">
                  Belum ada data siswa untuk kelas dan mata pelajaran yang dipilih.
                </td>
              </tr>
            )}
            {siswaData.map((siswa, index) => (
              <motion.tr
                key={siswa.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="align-middle hover:bg-gray-50"
              >
                <td rowSpan={2} className="border-b border-gray-200 px-6 py-4 text-sm font-medium text-gray-900">
                  {index + 1}
                </td>
                <td rowSpan={2} className="border-b border-gray-200 px-6 py-4 text-sm text-gray-900">{siswa.nis}</td>
                <td rowSpan={2} className="border-b border-gray-200 px-6 py-4 text-sm text-gray-900">{siswa.nama}</td>
                <td className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Tugas</td>
                {tugasPenilaianOptions.map((jenis) => (
                  <td key={jenis} className="px-4 py-4 text-center">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={nilai[siswa.id]?.[jenis] ?? ''}
                      onChange={(e) => handleNilaiChange(siswa.id, jenis, e.target.value)}
                      disabled={Boolean(lockedNilai[siswa.id]?.[jenis])}
                      placeholder="0-100"
                      className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-center outline-none focus:ring-2 focus:ring-[#2563EB] disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </td>
                ))}
                <td rowSpan={2} className="border-b border-gray-200 px-6 py-4 text-center">
                  <span className="inline-flex min-w-20 justify-center rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-[#2563EB]">
                    {getRataRataSiswa(siswa.id, tugasPenilaianOptions)}
                  </span>
                </td>
                <td rowSpan={2} className="border-b border-gray-200 px-6 py-4 text-center">
                  <span className="inline-flex min-w-20 justify-center rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-[#2563EB]">
                    {getRataRataSiswa(siswa.id, quizPenilaianOptions)}
                  </span>
                </td>
              </motion.tr>
            )).flatMap((row, index) => {
              const siswa = siswaData[index];

              return [
                row,
                <tr key={`${siswa.id}-quiz`} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Quiz</td>
                  {quizPenilaianOptions.map((jenis) => (
                    <td key={jenis} className="px-4 py-4 text-center">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={nilai[siswa.id]?.[jenis] ?? ''}
                        onChange={(e) => handleNilaiChange(siswa.id, jenis, e.target.value)}
                        disabled={Boolean(lockedNilai[siswa.id]?.[jenis])}
                        placeholder="0-100"
                        className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-center outline-none focus:ring-2 focus:ring-[#2563EB] disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500"
                      />
                    </td>
                  ))}
                </tr>,
              ];
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={() => setIsImportModalOpen(true)}
          disabled={!hasSelectedFilters}
          className="flex items-center justify-center gap-2 rounded-lg border border-green-500 bg-green-500 px-6 py-3 font-medium text-white shadow-sm transition-all hover:bg-green-600 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-300"
        >
          <Upload size={20} />
          <span>Import Nilai</span>
        </button>
      </div>

      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xl rounded-xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-xl font-bold text-gray-900">Import Nilai</h3>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Tutup modal import nilai"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  File Excel
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleImportFileChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-medium file:text-[#2563EB] hover:file:bg-blue-100"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Format yang didukung: `.xlsx`, `.xls`, atau `.csv`
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-[#2563EB] transition-all hover:bg-blue-100"
              >
                <Download size={18} />
                <span>Unduh Template Excel</span>
              </button>

              <div className="flex gap-4 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="flex-1 rounded-lg border-2 border-gray-300 px-6 py-3 font-medium text-gray-700 transition-all hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleImportNilai}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-6 py-3 font-medium text-white transition-all hover:bg-blue-700"
                >
                  <Upload size={18} />
                  <span>Import File</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kelas
            </label>
            <select
              value={selectedKelas}
              onChange={(e) => {
                setSelectedKelas(e.target.value);
                setSelectedMapel('');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] outline-none"
            >
              <option value="" disabled>
                Pilih Kelas
              </option>
              {kelasOptions.map((kelas) => (
                <option key={kelas.id} value={kelas.nama}>
                  {kelas.nama}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mata Pelajaran
            </label>
            <select
              value={selectedMapel}
              onChange={(e) => setSelectedMapel(e.target.value)}
              disabled={!selectedKelas}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] outline-none"
            >
              <option value="" disabled>
                Pilih Mata Pelajaran
              </option>
              {mapelOptions.map((mapel) => (
                <option key={mapel.id} value={mapel.nama}>
                  {mapel.nama}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal
            </label>
            <input
              type="date"
              value={tanggalSekarang}
              onChange={(e) => setTanggalSekarang(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>
        </div>
      </div>

      {renderNilaiHarianTable()}

      <div className="flex justify-end rounded-xl border border-gray-200 bg-gray-50 p-6">
        <button
          onClick={handleSubmit}
          className="flex items-center gap-2 bg-[#2563EB] text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-all font-medium shadow-md"
        >
          <Save size={20} />
          <span>Simpan Nilai</span>
        </button>
      </div>

    </div>
  );
}
