'use client';

import { type ChangeEvent, useEffect, useMemo, useState } from 'react';
import { Save, Upload, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useToast, Toast } from '../../components/dashboard/Toast';
import { apiGet, apiPost } from '../../lib/apiClient';
import type { LearningAssignmentItem } from '../../lib/academicActivityStore';
import {
  defaultBobotPenilaianConfig,
  getGradeLabel,
  type BobotPenilaianConfig,
  type BobotPenilaianItem,
  type GradeRangeItem,
} from '../../lib/bobotPenilaianStore';
import type { KelasItem } from '../../lib/kelasStore';
import type { MasterPelajaran } from '../../lib/pelajaranStore';
import type { StudentItem } from '../../lib/siswaStore';

type JenisPenilaian = 'UTS' | 'UAS' | 'Quiz' | 'Tugas';

const jenisPenilaianOptions: JenisPenilaian[] = ['UTS', 'UAS', 'Quiz', 'Tugas'];

export default function InputNilai() {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [learningAssignments, setLearningAssignments] = useState<LearningAssignmentItem[]>([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [selectedMapel, setSelectedMapel] = useState('');
  const [tanggalSekarang, setTanggalSekarang] = useState('');
  const [bobotPenilaian, setBobotPenilaian] = useState<BobotPenilaianItem[]>(
    defaultBobotPenilaianConfig.bobot
  );
  const [gradeRanges, setGradeRanges] = useState<GradeRangeItem[]>(
    defaultBobotPenilaianConfig.gradeRanges
  );
  const [nilai, setNilai] = useState<Record<number, Partial<Record<JenisPenilaian, string>>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importContent, setImportContent] = useState('');
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    void apiGet<BobotPenilaianConfig>('/api/assessment-setting')
      .then((config) => {
        setBobotPenilaian(config.bobot);
        setGradeRanges(config.gradeRanges);
      })
      .catch(() => showToast('Gagal memuat bobot penilaian dari backend.', 'error'));
  }, []);

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
      })
      .catch(() => showToast('Gagal memuat data siswa dari backend.', 'error'));
  }, []);

  useEffect(() => {
    void apiGet<LearningAssignmentItem[]>('/api/learning-assignments')
      .then(setLearningAssignments)
      .catch(() => showToast('Gagal memuat data pelajaran yang diampu dari backend.', 'error'));
  }, []);

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

    const reader = new FileReader();
    reader.onload = () => setImportContent(String(reader.result ?? ''));
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleImportNilai = () => {
    if (!hasSelectedFilters) {
      showToast('Pilih kelas dan mata pelajaran terlebih dahulu sebelum import nilai.', 'error');
      return;
    }

    const rows = importContent
      .split(/\r?\n/)
      .map((row) => row.trim())
      .filter(Boolean)
      .map((row) => row.split(',').map((cell) => cell.trim()));

    if (rows.length < 2) {
      showToast('Format import belum valid. Gunakan header nis,uts,uas,quiz,tugas.', 'error');
      return;
    }

    const headers = rows[0].map((header) => header.toLowerCase());
    const nisIndex = headers.indexOf('nis');
    const jenisIndexes = Object.fromEntries(
      jenisPenilaianOptions.map((jenis) => [jenis, headers.indexOf(jenis.toLowerCase())])
    ) as Record<JenisPenilaian, number>;

    if (nisIndex === -1 || jenisPenilaianOptions.some((jenis) => jenisIndexes[jenis] === -1)) {
      showToast('Header CSV harus berisi nis, uts, uas, quiz, dan tugas.', 'error');
      return;
    }

    const siswaByNis = new Map(siswaData.map((student) => [student.nis, student]));
    let importedCount = 0;
    let invalidCount = 0;

    setNilai((current) => {
      const next = { ...current };

      rows.slice(1).forEach((row) => {
        const student = siswaByNis.get(row[nisIndex]);

        if (!student) {
          return;
        }

        const importedNilai = jenisPenilaianOptions.reduce<Partial<Record<JenisPenilaian, string>>>(
          (result, jenis) => {
            const value = row[jenisIndexes[jenis]] ?? '';
            const numberValue = Number(value);

            if (value === '' || !Number.isInteger(numberValue) || numberValue < 0 || numberValue > 100) {
              invalidCount += 1;
              return result;
            }

            result[jenis] = value;
            return result;
          },
          {}
        );

        if (Object.keys(importedNilai).length > 0) {
          importedCount += 1;
          next[student.id] = {
            ...next[student.id],
            ...importedNilai,
          };
        }
      });

      return next;
    });

    if (importedCount === 0) {
      showToast('Tidak ada NIS yang cocok dengan siswa pada kelas ini.', 'error');
      return;
    }

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

    const allFilled = siswaData.every((student) =>
      jenisPenilaianOptions.every((jenis) => nilai[student.id]?.[jenis] !== '')
    );
    if (!allFilled) {
      showToast('Harap isi semua jenis nilai untuk setiap siswa!', 'error');
      return;
    }

    setIsSaving(true);

    try {
      await Promise.all(
        siswaData.flatMap((student) =>
          jenisPenilaianOptions.map((jenis) =>
            apiPost('/api/grades', {
              nis: student.nis,
              nama: student.nama,
              kelas: student.kelas,
              tahunAjaran: student.tahunAjaran,
              mapel: selectedMapel,
              jenis,
              nilai: Number(nilai[student.id]?.[jenis]),
              tanggal: tanggalSekarang,
            })
          )
        )
      );

      showToast('Nilai berhasil disimpan ke backend!', 'success');
    } catch {
      showToast('Gagal menyimpan nilai ke backend.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const getRataRata = () => {
    const validNilai = siswaData.flatMap((student) =>
      jenisPenilaianOptions
        .map((jenis) => nilai[student.id]?.[jenis])
        .filter((item): item is string => Boolean(item))
        .map((item) => parseInt(item))
    );

    if (validNilai.length === 0) return 0;
    return (validNilai.reduce((a, b) => a + b, 0) / validNilai.length).toFixed(2);
  };

  const bobotByJenis = useMemo(
    () =>
      Object.fromEntries(
        jenisPenilaianOptions.map((jenis) => [
          jenis,
          bobotPenilaian.find((item) => item.jenisPenilaian === jenis)?.bobot ?? 0,
        ])
      ) as Record<JenisPenilaian, number>,
    [bobotPenilaian]
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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Input Nilai</h2>
          <p className="text-gray-600 mt-1">Input nilai ujian dan tugas siswa</p>
        </div>
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
            className="w-full max-w-2xl rounded-xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h3 className="font-semibold text-gray-900">Import Nilai</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Gunakan CSV dengan header nis,uts,uas,quiz,tugas
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                aria-label="Tutup modal import nilai"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                Format contoh: nis,uts,uas,quiz,tugas
              </div>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleImportFileChange}
                className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-lg file:border-0 file:bg-[#2563EB] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700"
              />
              <textarea
                value={importContent}
                onChange={(event) => setImportContent(event.target.value)}
                rows={8}
                placeholder={'nis,uts,uas,quiz,tugas\n2026001,85,90,80,88\n2026002,78,82,75,84'}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-mono outline-none focus:ring-2 focus:ring-[#2563EB]"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 px-6 py-4">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-white"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleImportNilai}
                className="inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                <Upload size={16} />
                Import
              </button>
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-gray-200 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Input Nilai - {selectedMapel || '-'}</h3>
            <p className="text-sm text-gray-600 mt-1">
              Kelas {selectedKelas || '-'}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="px-4 py-2 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Rata-rata Kelas</p>
              <p className="text-2xl font-bold text-[#2563EB]">{getRataRata()}</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  No
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  NIS
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Nama Siswa
                </th>
                {jenisPenilaianOptions.map((jenis) => (
                  <th
                    key={jenis}
                    className="px-4 py-4 text-center text-xs font-semibold text-gray-600 uppercase"
                  >
                    {jenis}
                  </th>
                ))}
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Rata-rata
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {!hasSelectedFilters && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">
                    Pilih kelas dan mata pelajaran terlebih dahulu untuk menampilkan data nilai.
                  </td>
                </tr>
              )}
              {hasSelectedFilters && siswaData.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-500">
                    Belum ada data siswa untuk kelas dan mata pelajaran yang dipilih.
                  </td>
                </tr>
              )}
              {siswaData.map((siswa, index) => {
                const nilaiSiswa = jenisPenilaianOptions
                  .map((jenis) => nilai[siswa.id]?.[jenis])
                  .filter((item): item is string => Boolean(item))
                  .map((item) => Number(item));
                const rataRataSiswa =
                  nilaiSiswa.length > 0
                    ? nilaiSiswa.reduce((total, item) => total + item, 0) / nilaiSiswa.length
                    : null;
                const grade =
                  rataRataSiswa === null ? null : getGradeLabel(rataRataSiswa, gradeRanges);
                return (
                  <motion.tr
                    key={siswa.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{siswa.nis}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{siswa.nama}</td>
                    {jenisPenilaianOptions.map((jenis) => (
                      <td key={jenis} className="px-4 py-4 text-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={nilai[siswa.id]?.[jenis] ?? ''}
                          onChange={(e) => handleNilaiChange(siswa.id, jenis, e.target.value)}
                          placeholder="0-100"
                          className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-center outline-none focus:ring-2 focus:ring-[#2563EB]"
                        />
                      </td>
                    ))}
                    <td className="px-6 py-4">
                      {rataRataSiswa !== null && grade !== null && (
                        <span
                          className={`px-3 py-1 rounded-full font-medium ${
                            grade === 'A'
                              ? 'bg-green-100 text-green-700'
                              : grade === 'B'
                              ? 'bg-blue-100 text-blue-700'
                              : grade === 'C'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {rataRataSiswa.toFixed(2)} / {grade}
                        </span>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 bg-[#2563EB] text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-all font-medium shadow-md"
          >
            <Save size={20} />
            <span>Simpan Nilai</span>
          </button>
        </div>
      </div>

    </div>
  );
}
