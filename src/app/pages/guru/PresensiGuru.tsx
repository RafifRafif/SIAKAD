'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useToast, Toast } from '../../components/dashboard/Toast';
import { apiRequest } from '../../lib/api';
import {
  getAllStudents,
  getAllSubjects,
  getAttendanceRecords,
  getCurrentAuthProfile,
  type BackendStudent,
  type BackendTeacherSubject,
} from '../../lib/guruData';

export default function PresensiGuru() {
  const [teacherId, setTeacherId] = useState<number | null>(null);
  const [subjects, setSubjects] = useState<BackendTeacherSubject[]>([]);
  const [students, setStudents] = useState<BackendStudent[]>([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [presensi, setPresensi] = useState<{ [key: number]: 'hadir' | 'tidak' | null }>({});
  const [keterangan, setKeterangan] = useState<{ [key: number]: string }>({});
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
        const teacherSubjects = subjectItems.filter((item) => item.teacher_id === profile.teacher?.id);

        setSubjects(teacherSubjects);
        setStudents(studentItems);

        const firstClassName = teacherSubjects.find((item) => item.school_class?.name)?.school_class?.name ?? '';
        const firstSubjectId =
          teacherSubjects.find((item) => item.school_class?.name === firstClassName)?.id ??
          teacherSubjects[0]?.id;

        setSelectedKelas(firstClassName);
        setSelectedSubjectId(firstSubjectId ? String(firstSubjectId) : '');
      } catch {
        showToast('Gagal memuat data presensi guru dari backend.', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
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
    () =>
      students.filter((item) =>
        activeSubject?.class_id ? item.class_id === activeSubject.class_id : false
      ),
    [activeSubject, students]
  );

  useEffect(() => {
    if (!teacherId || !activeSubject?.class_id || !activeSubject.id) {
      return;
    }

    const loadAttendance = async () => {
      try {
        const records = await getAttendanceRecords({
          teacherId,
          classId: activeSubject.class_id ?? undefined,
          subjectId: activeSubject.id,
          attendanceDate: tanggal,
        });

        setPresensi(
          Object.fromEntries(
            siswaKelas.map((student) => {
              const record = records.find((item) => item.student_id === student.id);
              const status =
                record?.status === 'Hadir'
                  ? 'hadir'
                  : record?.status
                    ? 'tidak'
                    : null;
              return [student.id, status];
            })
          )
        );
        setKeterangan(
          Object.fromEntries(
            siswaKelas.map((student) => {
              const record = records.find((item) => item.student_id === student.id);
              return [student.id, record?.notes ?? ''];
            })
          )
        );
      } catch {
        showToast('Gagal memuat presensi yang sudah tersimpan.', 'error');
      }
    };

    void loadAttendance();
  }, [teacherId, activeSubject?.id, activeSubject?.class_id, tanggal, siswaKelas]);

  useEffect(() => {
    if (!subjectOptions.some((item) => String(item.id) === selectedSubjectId)) {
      setSelectedSubjectId(subjectOptions[0] ? String(subjectOptions[0].id) : '');
    }
  }, [subjectOptions, selectedSubjectId]);

  const handleToggle = (id: number, status: 'hadir' | 'tidak') => {
    const nextStatus = presensi[id] === status ? null : status;
    setPresensi((current) => ({ ...current, [id]: nextStatus }));

    if (nextStatus !== 'tidak') {
      setKeterangan((current) => ({ ...current, [id]: '' }));
    }
  };

  const handleKeteranganChange = (id: number, value: string) => {
    setKeterangan((current) => ({ ...current, [id]: value }));
  };

  const handleSubmit = () => {
    if (!teacherId || !activeSubject?.id || !activeSubject.class_id) {
      showToast('Pilih kelas dan mata pelajaran terlebih dahulu.', 'error');
      return;
    }

    const allFilled = siswaKelas.every((student) => presensi[student.id] !== null);
    if (!allFilled) {
      showToast('Harap isi presensi semua siswa!', 'error');
      return;
    }

    const invalidKeterangan = siswaKelas.some(
      (student) => presensi[student.id] === 'tidak' && !keterangan[student.id]?.trim()
    );
    if (invalidKeterangan) {
      showToast('Lengkapi keterangan untuk siswa yang tidak hadir!', 'error');
      return;
    }

    void (async () => {
      try {
        const existingRecords = await getAttendanceRecords({
          teacherId,
          classId: activeSubject.class_id ?? undefined,
          subjectId: activeSubject.id,
          attendanceDate: tanggal,
        });

        await Promise.all(
          siswaKelas.map((student) => {
            const payload = {
              academic_year_id: student.academic_year_id ?? activeSubject.academic_year_id ?? null,
              class_id: activeSubject.class_id,
              subject_id: activeSubject.id,
              teacher_id: teacherId,
              student_id: student.id,
              attendance_date: tanggal,
              status: presensi[student.id] === 'hadir' ? 'Hadir' : 'Tidak Hadir',
              notes: presensi[student.id] === 'tidak' ? keterangan[student.id] : null,
            };
            const existingRecord = existingRecords.find((item) => item.student_id === student.id);

            return apiRequest(existingRecord ? `/attendance-records/${existingRecord.id}` : '/attendance-records', {
              method: existingRecord ? 'PUT' : 'POST',
              body: payload,
            });
          })
        );

        showToast('Presensi berhasil disimpan!', 'success');
      } catch {
        showToast('Gagal menyimpan presensi ke backend.', 'error');
      }
    })();
  };

  const totalHadir = Object.values(presensi).filter((status) => status === 'hadir').length;
  const totalTidak = Object.values(presensi).filter((status) => status === 'tidak').length;

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
        <h2 className="text-2xl font-bold text-gray-900">Input Presensi</h2>
        <p className="text-gray-600 mt-1">Catat kehadiran siswa</p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pilih Kelas
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
              Tanggal
            </label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] outline-none"
            />
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
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Daftar Siswa - Kelas {selectedKelas || '-'}</h3>
          <p className="text-sm text-gray-600 mt-1">Tandai kehadiran siswa</p>
        </div>

        {isLoading ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500">
            Memuat data siswa dari backend...
          </div>
        ) : siswaKelas.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500">
            Belum ada siswa pada kelas ini.
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-200">
              {siswaKelas.map((siswa, index) => (
                <motion.div
                  key={siswa.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-semibold text-gray-600">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{siswa.name}</p>
                        <p className="text-sm text-gray-600">NIS: {siswa.nis}</p>
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-[520px]">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
                        <button
                          onClick={() => handleToggle(siswa.id, 'hadir')}
                          className={`flex items-center gap-2 px-6 py-3 rounded-lg border-2 transition-all font-medium ${
                            presensi[siswa.id] === 'hadir'
                              ? 'bg-green-50 border-green-500 text-green-700'
                              : 'border-gray-300 text-gray-600 hover:border-green-500'
                          }`}
                        >
                          <Check size={20} />
                          <span>Hadir</span>
                        </button>
                        <button
                          onClick={() => handleToggle(siswa.id, 'tidak')}
                          className={`flex items-center gap-2 px-6 py-3 rounded-lg border-2 transition-all font-medium ${
                            presensi[siswa.id] === 'tidak'
                              ? 'bg-red-50 border-red-500 text-red-700'
                              : 'border-gray-300 text-gray-600 hover:border-red-500'
                          }`}
                        >
                          <X size={20} />
                          <span>Tidak Hadir</span>
                        </button>
                        <input
                          type="text"
                          value={keterangan[siswa.id] ?? ''}
                          onChange={(e) => handleKeteranganChange(siswa.id, e.target.value)}
                          disabled={presensi[siswa.id] !== 'tidak'}
                          placeholder={
                            presensi[siswa.id] === 'tidak'
                              ? 'Isi alasan tidak hadir'
                              : 'Aktif saat status Tidak Hadir'
                          }
                          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none lg:w-72 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 focus:ring-2 focus:ring-[#2563EB]"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Total: {siswaKelas.length} siswa |{' '}
                  <span className="text-green-600 font-medium">
                    Hadir: {totalHadir}
                  </span>{' '}
                  |{' '}
                  <span className="text-red-600 font-medium">
                    Tidak: {totalTidak}
                  </span>
                </div>
                <button
                  onClick={handleSubmit}
                  className="bg-[#2563EB] text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-all font-medium shadow-md"
                >
                  Simpan Presensi
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
