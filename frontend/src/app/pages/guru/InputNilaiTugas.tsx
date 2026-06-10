'use client';

import { useEffect, useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import { motion } from 'motion/react';
import { useToast, Toast } from '../../components/dashboard/Toast';
import { apiGet, apiPost } from '../../lib/apiClient';
import type { LearningAssignmentItem } from '../../lib/academicActivityStore';
import type { KelasItem } from '../../lib/kelasStore';
import type { MasterPelajaran } from '../../lib/pelajaranStore';
import type { StudentItem } from '../../lib/siswaStore';

type TugasKey =
  | 'Tugas 1'
  | 'Tugas 2'
  | 'Tugas 3'
  | 'Tugas 4'
  | 'Tugas 5'
  | 'Tugas 6'
  | 'Tugas 7'
  | 'Tugas 8'
  | 'Tugas 9'
  | 'Tugas 10';

const tugasOptions: TugasKey[] = [
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
];

export default function InputNilaiTugas() {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [learningAssignments, setLearningAssignments] = useState<LearningAssignmentItem[]>([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [selectedMapel, setSelectedMapel] = useState('');
  const [tanggalSekarang, setTanggalSekarang] = useState('');
  const [nilai, setNilai] = useState<Record<number, Partial<Record<TugasKey, string>>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    void apiGet<StudentItem[]>('/api/students')
      .then((items) => {
        setStudents(items);
        setNilai(
          Object.fromEntries(
            items.map((student) => [
              student.id,
              Object.fromEntries(tugasOptions.map((jenis) => [jenis, ''])),
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

  const handleNilaiChange = (id: number, jenis: TugasKey, value: string) => {
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

  const rataRataSiswa = (id: number) => {
    const nilaiSiswa = tugasOptions
      .map((jenis) => nilai[id]?.[jenis])
      .filter((item): item is string => Boolean(item))
      .map((item) => Number(item));

    if (nilaiSiswa.length === 0) {
      return null;
    }

    return nilaiSiswa.reduce((total, item) => total + item, 0) / nilaiSiswa.length;
  };

  const getRataRata = () => {
    const validNilai = siswaData.flatMap((student) =>
      tugasOptions
        .map((jenis) => nilai[student.id]?.[jenis])
        .filter((item): item is string => Boolean(item))
        .map((item) => parseInt(item))
    );

    if (validNilai.length === 0) return 0;
    return (validNilai.reduce((a, b) => a + b, 0) / validNilai.length).toFixed(2);
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
      tugasOptions.every((jenis) => nilai[student.id]?.[jenis] !== '')
    );

    if (!allFilled) {
      showToast('Harap isi semua nilai tugas untuk setiap siswa!', 'error');
      return;
    }

    setIsSaving(true);

    try {
      await Promise.all(
        siswaData.flatMap((student) =>
          tugasOptions.map((jenis) =>
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

      showToast('Nilai tugas berhasil disimpan ke backend!', 'success');
    } catch {
      showToast('Gagal menyimpan nilai tugas ke backend.', 'error');
    } finally {
      setIsSaving(false);
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

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Input Nilai Tugas</h2>
        <p className="text-gray-600 mt-1">Input nilai tugas siswa</p>
      </div>

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
            <h3 className="font-semibold text-gray-900">Input Nilai Tugas - {selectedMapel || '-'}</h3>
            <p className="text-sm text-gray-600 mt-1">
              Kelas {selectedKelas || '-'}
            </p>
          </div>
          <div className="px-4 py-2 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Rata-rata Kelas</p>
            <p className="text-2xl font-bold text-[#2563EB]">{getRataRata()}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1320px]">
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
                {tugasOptions.map((jenis) => (
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
                  <td colSpan={14} className="px-4 py-8 text-center text-sm text-gray-500">
                    Pilih kelas dan mata pelajaran terlebih dahulu untuk menampilkan data nilai tugas.
                  </td>
                </tr>
              )}
              {hasSelectedFilters && siswaData.length === 0 && (
                <tr>
                  <td colSpan={14} className="px-4 py-8 text-center text-sm text-gray-500">
                    Belum ada data siswa untuk kelas dan mata pelajaran yang dipilih.
                  </td>
                </tr>
              )}
              {siswaData.map((siswa, index) => {
                const average = rataRataSiswa(siswa.id);

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
                    {tugasOptions.map((jenis) => (
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
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      {average === null ? '-' : average.toFixed(2)}
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
            <span>Simpan Nilai Tugas</span>
          </button>
        </div>
      </div>
    </div>
  );
}
