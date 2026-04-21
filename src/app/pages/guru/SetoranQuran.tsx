'use client';

import { useState } from 'react';
import { Plus, Save } from 'lucide-react';
import { motion } from 'motion/react';
import { useToast, Toast } from '../../components/dashboard/Toast';

const siswaData = [
  { id: 1, nis: '2024001', nama: 'Ahmad Fauzi', progress: 5 },
  { id: 2, nis: '2024002', nama: 'Siti Nurhaliza', progress: 3 },
  { id: 3, nis: '2024003', nama: 'Muhammad Rizki', progress: 7 },
];

export default function SetoranQuran() {
  const [selectedSiswa, setSelectedSiswa] = useState(siswaData[0].id);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [surah, setSurah] = useState('');
  const [ayatMulai, setAyatMulai] = useState('');
  const [ayatSelesai, setAyatSelesai] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [nilai, setNilai] = useState('Lancar');
  const { toasts, showToast, removeToast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Setoran Al-Qur\'an berhasil disimpan!', 'success');
    setSurah('');
    setAyatMulai('');
    setAyatSelesai('');
    setKeterangan('');
  };

  const selectedStudent = siswaData.find((s) => s.id === selectedSiswa);
  const progressPercent = ((selectedStudent?.progress || 0) / 30) * 100;

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
        <h2 className="text-2xl font-bold text-gray-900">Setoran Hafalan Al-Qur'an</h2>
        <p className="text-gray-600 mt-1">Catat progress hafalan siswa</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Student Progress Cards */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-semibold text-gray-900">Progress Siswa</h3>
          {siswaData.map((siswa) => (
            <motion.div
              key={siswa.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => setSelectedSiswa(siswa.id)}
              className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                selectedSiswa === siswa.id
                  ? 'border-[#2563EB] bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <p className="font-semibold text-gray-900 mb-2">{siswa.nama}</p>
              <p className="text-xs text-gray-600 mb-3">NIS: {siswa.nis}</p>
              <div className="mb-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Progress Hafalan</span>
                  <span className="font-medium text-[#2563EB]">
                    {siswa.progress} Juz
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#2563EB] h-2 rounded-full transition-all"
                    style={{ width: `${(siswa.progress / 30) * 100}%` }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Input Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="font-semibold text-green-900 mb-2">
                {selectedStudent?.nama}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-700">Progress Hafalan</span>
                <span className="font-bold text-green-900">
                  {selectedStudent?.progress} / 30 Juz ({progressPercent.toFixed(0)}%)
                </span>
              </div>
              <div className="w-full bg-green-200 rounded-full h-3 mt-2">
                <div
                  className="bg-green-600 h-3 rounded-full transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Setoran
                  </label>
                  <input
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Surah
                  </label>
                  <input
                    type="text"
                    value={surah}
                    onChange={(e) => setSurah(e.target.value)}
                    placeholder="Contoh: Al-Baqarah"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ayat Mulai
                  </label>
                  <input
                    type="number"
                    value={ayatMulai}
                    onChange={(e) => setAyatMulai(e.target.value)}
                    placeholder="1"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ayat Selesai
                  </label>
                  <input
                    type="number"
                    value={ayatSelesai}
                    onChange={(e) => setAyatSelesai(e.target.value)}
                    placeholder="10"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Penilaian
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['Lancar', 'Kurang Lancar', 'Perlu Perbaikan'].map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setNilai(item)}
                      className={`py-3 px-4 rounded-lg border-2 transition-all font-medium text-sm ${
                        nilai === item
                          ? item === 'Lancar'
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : item === 'Kurang Lancar'
                            ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                            : 'border-red-500 bg-red-50 text-red-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keterangan
                </label>
                <textarea
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  placeholder="Catatan tambahan (opsional)"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-[#2563EB] text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all font-medium shadow-md"
              >
                <Save size={20} />
                <span>Simpan Setoran</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
