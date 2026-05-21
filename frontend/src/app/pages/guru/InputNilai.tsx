'use client';

import { useEffect, useMemo, useState } from 'react';
import { Save } from 'lucide-react';
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

export default function InputNilai() {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [learningAssignments, setLearningAssignments] = useState<LearningAssignmentItem[]>([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [selectedMapel, setSelectedMapel] = useState('');
  const [jenisPenilaian, setJenisPenilaian] = useState('');
  const [tanggalSekarang, setTanggalSekarang] = useState('');
  const [bobotPenilaian, setBobotPenilaian] = useState<BobotPenilaianItem[]>(
    defaultBobotPenilaianConfig.bobot
  );
  const [gradeRanges, setGradeRanges] = useState<GradeRangeItem[]>(
    defaultBobotPenilaianConfig.gradeRanges
  );
  const [nilai, setNilai] = useState<{ [key: number]: string }>({});
  const [isSaving, setIsSaving] = useState(false);
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
        setNilai(Object.fromEntries(items.map((student) => [student.id, ''])));
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
      Array.from(
        new Map(
          learningAssignments
            .filter((item) => !selectedKelas || item.kelas === selectedKelas)
            .map((item) => [
              item.nama,
              {
                id: item.id,
                nama: item.nama,
                tahunAjaran: item.tahunAjaran,
              },
            ])
        ).values()
      ),
    [learningAssignments, selectedKelas]
  );

  useEffect(() => {
    setSelectedKelas((current) =>
      current && kelasOptions.some((kelas) => kelas.nama === current)
        ? current
        : kelasOptions[0]?.nama ?? ''
    );
  }, [kelasOptions]);

  useEffect(() => {
    setSelectedMapel((current) =>
      current && mapelOptions.some((mapel) => mapel.nama === current)
        ? current
        : mapelOptions[0]?.nama ?? ''
    );
  }, [mapelOptions]);

  const siswaData = useMemo(
    () =>
      selectedKelas
        ? students.filter((student) => student.kelas === selectedKelas)
        : [],
    [selectedKelas, students]
  );

  const handleNilaiChange = (id: number, value: string) => {
    const numValue = parseInt(value);
    if (value === '' || (numValue >= 0 && numValue <= 100)) {
      setNilai((current) => ({ ...current, [id]: value }));
    }
  };

  const handleSubmit = async () => {
    if (isSaving) {
      return;
    }

    if (!selectedKelas || !selectedMapel || !jenisPenilaian || !tanggalSekarang) {
      showToast('Pilih kelas, mata pelajaran, jenis penilaian, dan tanggal terlebih dahulu.', 'error');
      return;
    }

    if (siswaData.length === 0) {
      showToast('Belum ada data siswa dari backend.', 'error');
      return;
    }

    const allFilled = siswaData.every((student) => nilai[student.id] !== '');
    if (!allFilled) {
      showToast('Harap isi nilai semua siswa!', 'error');
      return;
    }

    setIsSaving(true);

    try {
      await Promise.all(
        siswaData.map((student) =>
          apiPost('/api/grades', {
            nis: student.nis,
            nama: student.nama,
            kelas: student.kelas,
            tahunAjaran: student.tahunAjaran,
            mapel: selectedMapel,
            jenis: jenisPenilaian,
            nilai: Number(nilai[student.id]),
            tanggal: tanggalSekarang,
          })
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
    const validNilai = siswaData
      .map((student) => nilai[student.id])
      .filter((item) => item !== '')
      .map((item) => parseInt(item));

    if (validNilai.length === 0) return 0;
    return (validNilai.reduce((a, b) => a + b, 0) / validNilai.length).toFixed(2);
  };

  const bobotAktif = useMemo(
    () => bobotPenilaian.find((item) => item.jenisPenilaian === jenisPenilaian)?.bobot ?? 0,
    [bobotPenilaian, jenisPenilaian]
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

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Input Nilai</h2>
        <p className="text-gray-600 mt-1">Input nilai ujian dan tugas siswa</p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kelas
            </label>
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] outline-none"
            >
              <option value="" disabled>
                Pilih kelas
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] outline-none"
            >
              <option value="" disabled>
                Pilih mata pelajaran
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
              Jenis Penilaian
            </label>
            <select
              value={jenisPenilaian}
              onChange={(e) => setJenisPenilaian(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] outline-none"
            >
              <option value="" disabled>
                Pilih jenis penilaian
              </option>
              {['UTS', 'UAS', 'Tugas', 'Quiz'].map((jenis) => (
                <option key={jenis} value={jenis}>
                  {jenis}
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
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Input Nilai - {selectedMapel || '-'}</h3>
            <p className="text-sm text-gray-600 mt-1">
              Kelas {selectedKelas || '-'} - {jenisPenilaian}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Grade mengikuti pengaturan admin. Bobot {jenisPenilaian}: {bobotAktif}%
            </p>
          </div>
          <div className="px-4 py-2 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Rata-rata Kelas</p>
            <p className="text-2xl font-bold text-[#2563EB]">{getRataRata()}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
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
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Nilai (0-100)
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Grade
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {siswaData.map((siswa, index) => {
                const hasNilai = nilai[siswa.id] !== undefined && nilai[siswa.id] !== '';
                const nilaiSiswa = Number(nilai[siswa.id]);
                const grade = getGradeLabel(nilaiSiswa, gradeRanges);
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
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={nilai[siswa.id] ?? ''}
                        onChange={(e) => handleNilaiChange(siswa.id, e.target.value)}
                        placeholder="0-100"
                        className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] outline-none"
                      />
                    </td>
                    <td className="px-6 py-4">
                      {hasNilai && !Number.isNaN(nilaiSiswa) && (
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
                          {grade}
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
