'use client';

import { useEffect, useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import { motion } from 'motion/react';
import { useToast, Toast } from '../../components/dashboard/Toast';
import {
  BOBOT_PENILAIAN_STORAGE_KEY,
  defaultBobotPenilaianConfig,
  getGradeLabel,
  type BobotPenilaianItem,
  type GradeRangeItem,
} from '../../lib/bobotPenilaianStore';

const siswaData = [
  { id: 1, nis: '2024001', nama: 'Ahmad Fauzi' },
  { id: 2, nis: '2024002', nama: 'Siti Nurhaliza' },
  { id: 3, nis: '2024003', nama: 'Muhammad Rizki' },
  { id: 4, nis: '2024004', nama: 'Fatimah Azzahra' },
  { id: 5, nis: '2024005', nama: 'Abdullah Rahman' },
];

export default function InputNilai() {
  const [selectedKelas, setSelectedKelas] = useState('X-A');
  const [selectedMapel, setSelectedMapel] = useState('Matematika');
  const [jenisPenilaian, setJenisPenilaian] = useState('UTS');
  const [tanggalSekarang] = useState(() => new Date().toISOString().split('T')[0]);
  const [bobotPenilaian, setBobotPenilaian] = useState<BobotPenilaianItem[]>(
    defaultBobotPenilaianConfig.bobot
  );
  const [gradeRanges, setGradeRanges] = useState<GradeRangeItem[]>(
    defaultBobotPenilaianConfig.gradeRanges
  );
  const [nilai, setNilai] = useState<{ [key: number]: string }>(
    Object.fromEntries(siswaData.map((s) => [s.id, '']))
  );
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    const storedConfig = window.localStorage.getItem(BOBOT_PENILAIAN_STORAGE_KEY);
    if (!storedConfig) {
      window.localStorage.setItem(
        BOBOT_PENILAIAN_STORAGE_KEY,
        JSON.stringify(defaultBobotPenilaianConfig)
      );
      return;
    }

    try {
      const parsedConfig = JSON.parse(storedConfig) as typeof defaultBobotPenilaianConfig;
      if (Array.isArray(parsedConfig.bobot) && Array.isArray(parsedConfig.gradeRanges)) {
        setBobotPenilaian(parsedConfig.bobot);
        setGradeRanges(parsedConfig.gradeRanges);
      }
    } catch {
      window.localStorage.setItem(
        BOBOT_PENILAIAN_STORAGE_KEY,
        JSON.stringify(defaultBobotPenilaianConfig)
      );
    }
  }, []);

  const handleNilaiChange = (id: number, value: string) => {
    const numValue = parseInt(value);
    if (value === '' || (numValue >= 0 && numValue <= 100)) {
      setNilai({ ...nilai, [id]: value });
    }
  };

  const handleSubmit = () => {
    const allFilled = Object.values(nilai).every((n) => n !== '');
    if (!allFilled) {
      showToast('Harap isi nilai semua siswa!', 'error');
      return;
    }
    showToast('Nilai berhasil disimpan!', 'success');
  };

  const getRataRata = () => {
    const validNilai = Object.values(nilai).filter((n) => n !== '').map((n) => parseInt(n));
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
              <option>X-A</option>
              <option>XI-B</option>
              <option>XII-A</option>
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
              <option>Matematika</option>
              <option>Fisika</option>
              <option>Kimia</option>
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
              <option>UTS</option>
              <option>UAS</option>
              <option>Tugas</option>
              <option>Quiz</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal
            </label>
            <input
              type="text"
              value={tanggalSekarang}
              readOnly
              className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-4 py-2 text-gray-600 outline-none"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Input Nilai - {selectedMapel}</h3>
            <p className="text-sm text-gray-600 mt-1">
              Kelas {selectedKelas} - {jenisPenilaian}
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
                const nilaiSiswa = parseInt(nilai[siswa.id] || '0');
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
                        value={nilai[siswa.id]}
                        onChange={(e) => handleNilaiChange(siswa.id, e.target.value)}
                        placeholder="0-100"
                        className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] outline-none"
                      />
                    </td>
                    <td className="px-6 py-4">
                      {nilai[siswa.id] && (
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
