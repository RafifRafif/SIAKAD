'use client';

import { useEffect, useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import { motion } from 'motion/react';
import { useToast, Toast } from '../../components/dashboard/Toast';
import { apiRequest } from '../../lib/api';
import {
  getAllStudents,
  getAllSubjects,
  getCurrentAuthProfile,
  getQuranDeposits,
  getRelevantClassIds,
  type BackendQuranDeposit,
  type BackendStudent,
} from '../../lib/guruData';

export default function SetoranQuran() {
  const [teacherId, setTeacherId] = useState<number | null>(null);
  const [students, setStudents] = useState<BackendStudent[]>([]);
  const [deposits, setDeposits] = useState<BackendQuranDeposit[]>([]);
  const [selectedSiswa, setSelectedSiswa] = useState<number | null>(null);
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [surah, setSurah] = useState('');
  const [ayatMulai, setAyatMulai] = useState('');
  const [ayatSelesai, setAyatSelesai] = useState('');
  const [keterangan, setKeterangan] = useState('');
  const [nilai, setNilai] = useState<'Lancar' | 'Kurang Lancar' | 'Perlu Perbaikan'>('Lancar');
  const [isLoading, setIsLoading] = useState(true);
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        const profile = await getCurrentAuthProfile();
        if (!profile?.teacher?.id) {
          showToast('Profil guru tidak ditemukan.', 'error');
          return;
        }

        setTeacherId(profile.teacher.id);

        const [subjectItems, studentItems] = await Promise.all([getAllSubjects(), getAllStudents()]);
        const relevantClassIds = getRelevantClassIds(profile, subjectItems.filter((item) => item.teacher_id === profile.teacher?.id));
        const relevantStudents = studentItems.filter((item) => item.class_id && relevantClassIds.includes(item.class_id));

        setStudents(relevantStudents);
        setSelectedSiswa(relevantStudents[0]?.id ?? null);

        const depositItems = await getQuranDeposits({ teacherId: profile.teacher.id });
        setDeposits(depositItems);
      } catch {
        showToast('Gagal memuat data setoran Al-Qur’an dari backend.', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, []);

  const progressByStudent = useMemo(
    () =>
      students.map((student) => ({
        ...student,
        progress: deposits.filter((deposit) => deposit.student_id === student.id).length,
      })),
    [deposits, students]
  );

  const selectedStudent = progressByStudent.find((student) => student.id === selectedSiswa) ?? null;
  const progressPercent = selectedStudent ? Math.min((selectedStudent.progress / 30) * 100, 100) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!teacherId || !selectedSiswa) {
      showToast('Pilih siswa terlebih dahulu.', 'error');
      return;
    }

    try {
      const response = await apiRequest<{ data: BackendQuranDeposit }>('/quran-deposits', {
        method: 'POST',
        body: {
          teacher_id: teacherId,
          student_id: selectedSiswa,
          deposit_date: tanggal,
          surah,
          verse_start: Number(ayatMulai),
          verse_end: Number(ayatSelesai),
          assessment: nilai,
          notes: keterangan || null,
        },
      });

      setDeposits((current) => [response.data, ...current]);
      showToast('Setoran Al-Qur\'an berhasil disimpan!', 'success');
      setSurah('');
      setAyatMulai('');
      setAyatSelesai('');
      setKeterangan('');
    } catch {
      showToast('Gagal menyimpan setoran Al-Qur’an ke backend.', 'error');
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
        <h2 className="text-2xl font-bold text-gray-900">Setoran Hafalan Al-Qur'an</h2>
        <p className="text-gray-600 mt-1">Catat progress hafalan siswa</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-semibold text-gray-900">Progress Siswa</h3>
          {isLoading ? (
            <div className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-500 shadow-sm">
              Memuat siswa dari backend...
            </div>
          ) : progressByStudent.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-500 shadow-sm">
              Belum ada siswa yang sesuai dengan data kelas guru.
            </div>
          ) : (
            progressByStudent.map((siswa) => (
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
                <p className="font-semibold text-gray-900 mb-2">{siswa.name}</p>
                <p className="text-xs text-gray-600 mb-3">NIS: {siswa.nis}</p>
                <div className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Total Setoran</span>
                    <span className="font-medium text-[#2563EB]">
                      {siswa.progress} kali
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#2563EB] h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((siswa.progress / 30) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="font-semibold text-green-900 mb-2">
                {selectedStudent?.name ?? '-'}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-700">Total Setoran Tercatat</span>
                <span className="font-bold text-green-900">
                  {selectedStudent?.progress ?? 0} kali ({progressPercent.toFixed(0)}%)
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
                    Siswa
                  </label>
                  <select
                    value={selectedSiswa ?? ''}
                    onChange={(e) => setSelectedSiswa(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] outline-none"
                  >
                    {progressByStudent.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Penilaian
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['Lancar', 'Kurang Lancar', 'Perlu Perbaikan'] as const).map((item) => (
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
