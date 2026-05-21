'use client';

import { useEffect, useMemo, useState } from 'react';
import { Save, Search } from 'lucide-react';
import { motion } from 'motion/react';
import { useToast, Toast } from '../../components/dashboard/Toast';
import { apiGet, apiPost } from '../../lib/apiClient';
import type { QuranSubmissionItem } from '../../lib/academicActivityStore';
import type { StudentItem } from '../../lib/siswaStore';

const getCurrentDate = () => new Date().toISOString().split('T')[0];

export default function SetoranQuran() {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [submissions, setSubmissions] = useState<QuranSubmissionItem[]>([]);
  const [selectedSiswa, setSelectedSiswa] = useState<number | null>(null);
  const tanggal = getCurrentDate();
  const [surah, setSurah] = useState('');
  const [ayatMulai, setAyatMulai] = useState('');
  const [ayatSelesai, setAyatSelesai] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [nilai, setNilai] = useState('Lancar');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    void apiGet<StudentItem[]>('/api/students')
      .then((items) => {
        setStudents(items);
        setSelectedSiswa((current) => current ?? items[0]?.id ?? null);
      })
      .catch(() => showToast('Gagal memuat data siswa dari backend.', 'error'));
  }, []);

  const loadSubmissions = async () => {
    const items = await apiGet<QuranSubmissionItem[]>('/api/quran-submissions');
    setSubmissions(items);
  };

  useEffect(() => {
    void loadSubmissions().catch(() =>
      showToast('Gagal memuat setoran Qur\'an dari backend.', 'error')
    );
  }, []);

  const progressByNis = useMemo(
    () =>
      submissions.reduce<Record<string, number>>((accumulator, item) => {
        accumulator[item.nis] = Math.max(accumulator[item.nis] ?? 0, item.progress ?? 0);
        return accumulator;
      }, {}),
    [submissions]
  );

  const siswaData = useMemo(
    () =>
      students.map((student) => ({
        ...student,
        progress: progressByNis[student.nis] ?? 0,
      })),
    [students, progressByNis]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSaving) {
      return;
    }

    const selectedStudent = siswaData.find((s) => s.id === selectedSiswa);
    if (!selectedStudent) {
      showToast('Pilih siswa dari data backend terlebih dahulu.', 'error');
      return;
    }

    setIsSaving(true);

    try {
      const savedSubmission = await apiPost<QuranSubmissionItem>('/api/quran-submissions', {
        nis: selectedStudent.nis,
        nama: selectedStudent.nama,
        kelas: selectedStudent.kelas,
        tanggal,
        surah: surah.trim(),
        ayatMulai: Number(ayatMulai),
        ayatSelesai: Number(ayatSelesai),
        penilaian: nilai,
        keterangan: keterangan.trim() || null,
        progress: selectedStudent.progress,
      });

      setSubmissions((current) => upsertQuranSubmission(current, savedSubmission));
      showToast('Setoran Al-Qur\'an berhasil disimpan ke backend!', 'success');
      setSurah('');
      setAyatMulai('');
      setAyatSelesai('');
      setKeterangan('');
    } catch {
      showToast('Gagal menyimpan setoran Al-Qur\'an ke backend.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedStudent = siswaData.find((s) => s.id === selectedSiswa);
  const progressPercent = ((selectedStudent?.progress || 0) / 30) * 100;
  const filteredSiswa = siswaData.filter(
    (siswa) =>
      siswa.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      siswa.nis.includes(searchQuery)
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
        <h2 className="text-2xl font-bold text-gray-900">Setoran Hafalan Al-Qur'an</h2>
        <p className="text-gray-600 mt-1">Catat progress hafalan siswa</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Student Progress Cards */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-semibold text-gray-900">Progress Siswa</h3>
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau NIS..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>
          <div className="max-h-[544px] space-y-4 overflow-y-auto pr-2">
            {filteredSiswa.map((siswa) => (
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
            {filteredSiswa.length === 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
                Siswa tidak ditemukan.
              </div>
            )}
          </div>
        </div>

        {/* Input Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="font-semibold text-green-900 mb-2">
                {selectedStudent?.nama || '-'}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-700">Progress Hafalan</span>
                <span className="font-bold text-green-900">
                  {selectedStudent?.progress ?? 0} / 30 Juz ({progressPercent.toFixed(0)}%)
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
                    readOnly
                    required
                    className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-4 py-2 text-gray-700 outline-none"
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    Tanggal otomatis mengikuti hari ini dan tidak dapat diubah.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Surah
                  </label>
                  <input
                    type="text"
                    value={surah}
                    onChange={(e) => setSurah(e.target.value)}
                    placeholder="Nama surah"
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

const upsertQuranSubmission = (
  items: QuranSubmissionItem[],
  nextItem: QuranSubmissionItem
) =>
  items.some((item) => item.id === nextItem.id)
    ? items.map((item) => (item.id === nextItem.id ? nextItem : item))
    : [nextItem, ...items];
