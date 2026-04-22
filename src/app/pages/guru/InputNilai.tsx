'use client';

import { useEffect, useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import { motion } from 'motion/react';
import { useToast, Toast } from '../../components/dashboard/Toast';
import { apiRequest } from '../../lib/api';
import {
  getGradeLabel,
  type BobotPenilaianItem,
  type GradeRangeItem,
} from '../../lib/bobotPenilaianStore';
import {
  getAllStudents,
  getAllSubjects,
  getCurrentAuthProfile,
  getGradeEntries,
  type BackendStudent,
  type BackendTeacherSubject,
} from '../../lib/guruData';

interface BackendGradeWeight {
  components?: BobotPenilaianItem[] | null;
  grade_ranges?: GradeRangeItem[] | null;
}

export default function InputNilai() {
  const [teacherId, setTeacherId] = useState<number | null>(null);
  const [subjects, setSubjects] = useState<BackendTeacherSubject[]>([]);
  const [students, setStudents] = useState<BackendStudent[]>([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [jenisPenilaian, setJenisPenilaian] = useState('UTS');
  const [tanggalSekarang] = useState(() => new Date().toISOString().split('T')[0]);
  const [bobotPenilaian, setBobotPenilaian] = useState<BobotPenilaianItem[]>([]);
  const [gradeRanges, setGradeRanges] = useState<GradeRangeItem[]>([]);
  const [nilai, setNilai] = useState<{ [key: number]: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const profile = await getCurrentAuthProfile();
        if (!profile?.teacher?.id) {
          showToast('Profil guru tidak ditemukan.', 'error');
          return;
        }

        setTeacherId(profile.teacher.id);

        const [subjectItems, studentItems, gradeWeightResponse] = await Promise.all([
          getAllSubjects(),
          getAllStudents(),
          apiRequest<{ data: BackendGradeWeight[] }>('/grade-weights'),
        ]);

        const teacherSubjects = subjectItems.filter((item) => item.teacher_id === profile.teacher?.id);
        setSubjects(teacherSubjects);
        setStudents(studentItems);

        const firstClassName = teacherSubjects.find((item) => item.school_class?.name)?.school_class?.name ?? '';
        const firstSubjectId =
          teacherSubjects.find((item) => item.school_class?.name === firstClassName)?.id ??
          teacherSubjects[0]?.id;

        setSelectedKelas(firstClassName);
        setSelectedSubjectId(firstSubjectId ? String(firstSubjectId) : '');

        const activeConfig = gradeWeightResponse.data[0];
        if (activeConfig) {
          setBobotPenilaian(activeConfig.components ?? []);
          setGradeRanges(activeConfig.grade_ranges ?? []);
        }
      } catch {
        showToast('Gagal memuat data nilai dari backend.', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    void loadInitialData();
  }, []);

  const kelasOptions = useMemo(
    () =>
      Array.from(
        new Map(
          subjects
            .filter((item) => item.school_class?.name)
            .map((item) => [item.school_class?.name, item.school_class])
        ).values()
      ),
    [subjects]
  );

  const subjectOptions = useMemo(
    () =>
      subjects.filter((item) =>
        selectedKelas ? item.school_class?.name === selectedKelas : true
      ),
    [selectedKelas, subjects]
  );

  const activeSubject = useMemo(
    () => subjectOptions.find((item) => String(item.id) === selectedSubjectId) ?? subjectOptions[0] ?? null,
    [selectedSubjectId, subjectOptions]
  );

  const siswaKelas = useMemo(
    () => students.filter((item) => (activeSubject?.class_id ? item.class_id === activeSubject.class_id : false)),
    [activeSubject, students]
  );

  useEffect(() => {
    if (!teacherId || !activeSubject?.id || !activeSubject.class_id) {
      return;
    }

    const loadExistingEntries = async () => {
      try {
        const entries = await getGradeEntries({
          teacherId,
          classId: activeSubject.class_id ?? undefined,
          subjectId: activeSubject.id,
          assessmentType: jenisPenilaian,
        });

        setNilai(
          Object.fromEntries(
            siswaKelas.map((student) => {
              const entry = entries.find(
                (item) =>
                  item.student_id === student.id &&
                  item.entry_date.slice(0, 10) === tanggalSekarang
              );
              return [student.id, entry ? String(entry.score) : ''];
            })
          )
        );
      } catch {
        showToast('Gagal memuat nilai yang sudah tersimpan.', 'error');
      }
    };

    void loadExistingEntries();
  }, [teacherId, activeSubject?.id, activeSubject?.class_id, jenisPenilaian, tanggalSekarang, siswaKelas]);

  useEffect(() => {
    if (!subjectOptions.some((item) => String(item.id) === selectedSubjectId)) {
      setSelectedSubjectId(subjectOptions[0] ? String(subjectOptions[0].id) : '');
    }
  }, [selectedSubjectId, subjectOptions]);

  const handleNilaiChange = (id: number, value: string) => {
    const numValue = parseInt(value, 10);
    if (value === '' || (numValue >= 0 && numValue <= 100)) {
      setNilai((current) => ({ ...current, [id]: value }));
    }
  };

  const handleSubmit = () => {
    if (!teacherId || !activeSubject?.id) {
      showToast('Pilih kelas dan mata pelajaran terlebih dahulu!', 'error');
      return;
    }

    const allFilled = siswaKelas.every((student) => nilai[student.id] !== '');
    if (!allFilled) {
      showToast('Harap isi nilai semua siswa!', 'error');
      return;
    }

    void (async () => {
      try {
        const existingEntries = await getGradeEntries({
          teacherId,
          classId: activeSubject.class_id ?? undefined,
          subjectId: activeSubject.id,
          assessmentType: jenisPenilaian,
        });

        await Promise.all(
          siswaKelas.map((student) => {
            const payload = {
              academic_year_id: student.academic_year_id ?? activeSubject.academic_year_id ?? null,
              subject_id: activeSubject.id,
              teacher_id: teacherId,
              student_id: student.id,
              assessment_type: jenisPenilaian,
              score: Number(nilai[student.id]),
              entry_date: tanggalSekarang,
              notes: null,
            };
            const existingEntry = existingEntries.find(
              (item) =>
                item.student_id === student.id &&
                item.entry_date.slice(0, 10) === tanggalSekarang
            );

            return apiRequest(existingEntry ? `/grade-entries/${existingEntry.id}` : '/grade-entries', {
              method: existingEntry ? 'PUT' : 'POST',
              body: payload,
            });
          })
        );

        showToast('Nilai berhasil disimpan!', 'success');
      } catch {
        showToast('Gagal menyimpan nilai ke backend.', 'error');
      }
    })();
  };

  const getRataRata = () => {
    const validNilai = Object.values(nilai).filter((item) => item !== '').map((item) => parseInt(item, 10));
    if (validNilai.length === 0) return '0.00';
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
              {kelasOptions.map((kelas) => (
                <option key={kelas?.id} value={kelas?.name}>
                  {kelas?.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mata Pelajaran
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] outline-none"
            >
              {subjectOptions.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
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
            <h3 className="font-semibold text-gray-900">Input Nilai - {activeSubject?.name ?? '-'}</h3>
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

        {isLoading ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500">
            Memuat data nilai dari backend...
          </div>
        ) : siswaKelas.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500">
            Belum ada siswa pada kelas ini.
          </div>
        ) : (
          <>
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
                  {siswaKelas.map((siswa, index) => {
                    const nilaiSiswa = parseInt(nilai[siswa.id] || '0', 10);
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
                        <td className="px-6 py-4 text-sm text-gray-900">{siswa.name}</td>
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
                          {nilai[siswa.id] && gradeRanges.length > 0 && (
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
          </>
        )}
      </div>
    </div>
  );
}
