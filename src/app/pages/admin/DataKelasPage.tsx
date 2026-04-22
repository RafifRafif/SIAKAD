'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Edit, Trash2, X, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EmptyState } from '../../components/dashboard/EmptyState';
import { Toast, useToast } from '../../components/dashboard/Toast';
import { apiRequest } from '../../lib/api';
import {
  type GuruItem,
  type KelasItem as Kelas,
  type StudentItem,
  type TahunAjaranItem,
} from '../../lib/masterDataTypes';

interface BackendAcademicYear {
  id: number;
  name: string;
  semester: 'Ganjil' | 'Genap';
  is_active: boolean;
}

interface BackendTeacher {
  id: number;
  name: string;
  roles: ('Wali Kelas' | 'Guru Mapel')[];
}

interface BackendStudent {
  id: number;
  class_id: number | null;
}

interface BackendClass {
  id: number;
  name: string;
  level: 'X' | 'XI' | 'XII';
  group_type: 'Ikhwan' | 'Akhwat' | null;
  capacity: number;
  homeroom_teacher_name: string | null;
  academic_year?: BackendAcademicYear | null;
}

const defaultFormData = {
  nama: '',
  tahunAjaran: '',
  kelompok: 'Ikhwan' as 'Ikhwan' | 'Akhwat',
  waliKelas: '',
  jumlahSiswa: 0,
};

const mapAcademicYearToOption = (item: BackendAcademicYear): TahunAjaranItem => ({
  id: item.id,
  nama: item.name,
  semester: item.semester,
  tanggalMulai: '',
  tanggalSelesai: '',
  status: item.is_active ? 'Aktif' : 'Draft',
});

const mapTeacherToViewModel = (teacher: BackendTeacher): GuruItem => ({
  id: teacher.id,
  nip: '',
  nama: teacher.name,
  tahunAjaran: '',
  role: teacher.roles,
  email: '',
  telepon: '',
  status: 'Aktif',
});

const extractClassLevel = (className: string): 'X' | 'XI' | 'XII' | null => {
  const normalizedName = className.trim().toUpperCase();

  if (normalizedName.startsWith('XII')) {
    return 'XII';
  }

  if (normalizedName.startsWith('XI')) {
    return 'XI';
  }

  if (normalizedName.startsWith('X')) {
    return 'X';
  }

  return null;
};

export default function DataKelasPage() {
  const [kelas, setKelas] = useState<Kelas[]>([]);
  const [classMeta, setClassMeta] = useState<Record<number, BackendClass>>({});
  const [waliKelasOptions, setWaliKelasOptions] = useState<GuruItem[]>([]);
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [filterTahunAjaran, setFilterTahunAjaran] = useState('all');
  const [tahunAjaranOptions, setTahunAjaranOptions] = useState<TahunAjaranItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingKelas, setEditingKelas] = useState<Kelas | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toasts, showToast, removeToast } = useToast();

  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [classesResponse, teachersResponse, studentsResponse, academicYearsResponse] =
          await Promise.all([
            apiRequest<{ data: BackendClass[] }>('/classes'),
            apiRequest<{ data: BackendTeacher[] }>('/teachers'),
            apiRequest<{ data: BackendStudent[] }>('/students'),
            apiRequest<{ data: BackendAcademicYear[] }>('/academic-years'),
          ]);

        const studentsCountByClassId = studentsResponse.data.reduce<Record<number, number>>(
          (accumulator, student) => {
            if (student.class_id) {
              accumulator[student.class_id] = (accumulator[student.class_id] ?? 0) + 1;
            }

            return accumulator;
          },
          {}
        );

        setClassMeta(
          Object.fromEntries(classesResponse.data.map((item) => [item.id, item])) as Record<
            number,
            BackendClass
          >
        );
        setKelas(
          classesResponse.data.map((item) => ({
            id: item.id,
            nama: item.name,
            tahunAjaran: item.academic_year
              ? `${item.academic_year.name} ${item.academic_year.semester}`
              : '',
            kelompok: item.group_type ?? 'Ikhwan',
            waliKelas: item.homeroom_teacher_name ?? '',
            jumlahSiswa: studentsCountByClassId[item.id] ?? 0,
          }))
        );
        setWaliKelasOptions(
          teachersResponse.data
            .filter((item) => item.roles.includes('Wali Kelas'))
            .map(mapTeacherToViewModel)
        );
        setStudents(
          classesResponse.data.flatMap((item) =>
            Array.from({ length: studentsCountByClassId[item.id] ?? 0 }, (_, index) => ({
              id: Number(`${item.id}${index + 1}`),
              nis: '',
              nama: '',
              tahunAjaran: '',
              kelas: item.name,
              jenisKelamin: 'Laki-laki',
              email: '',
              telepon: '',
            }))
          )
        );
        setTahunAjaranOptions(academicYearsResponse.data.map(mapAcademicYearToOption));
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : 'Gagal memuat data kelas dari backend.',
          'error'
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, []);

  const jumlahSiswaByKelas = useMemo(
    () =>
      students.reduce<Record<string, number>>((accumulator, student) => {
        accumulator[student.kelas] = (accumulator[student.kelas] ?? 0) + 1;
        return accumulator;
      }, {}),
    [students]
  );

  const tahunAjaranList = useMemo(
    () => ['all', ...tahunAjaranOptions.map((item) => `${item.nama} ${item.semester}`)],
    [tahunAjaranOptions]
  );

  const filteredKelas = kelas.filter((item) => {
    const matchesSearch =
      item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kelompok.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.waliKelas.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTahunAjaran =
      filterTahunAjaran === 'all' || item.tahunAjaran === filterTahunAjaran;
    return matchesSearch && matchesTahunAjaran;
  });

  const handleAdd = () => {
    setEditingKelas(null);
    setFormData({
      ...defaultFormData,
      tahunAjaran: tahunAjaranList[1] ?? '',
      waliKelas: waliKelasOptions[0]?.nama ?? '',
    });
    setShowModal(true);
  };

  const handleEdit = (item: Kelas) => {
    setEditingKelas(item);
    setFormData(item);
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data kelas ini?')) {
      return;
    }

    void (async () => {
      try {
        const response = await apiRequest<{ message: string }>(`/classes/${id}`, {
          method: 'DELETE',
        });
        setKelas((currentKelas) => currentKelas.filter((item) => item.id !== id));
        showToast(response.message, 'success');
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : 'Gagal menghapus data kelas.',
          'error'
        );
      }
    })();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const level = extractClassLevel(formData.nama);

    if (!level) {
      showToast('Nama kelas harus diawali dengan X, XI, atau XII.', 'error');
      return;
    }

    const academicYearId =
      tahunAjaranOptions.find((item) => `${item.nama} ${item.semester}` === formData.tahunAjaran)
        ?.id ?? null;

    const payload = {
      name: formData.nama,
      academic_year_id: academicYearId,
      level,
      group_type: formData.kelompok,
      homeroom_teacher_name: formData.waliKelas || null,
      capacity: classMeta[editingKelas?.id ?? 0]?.capacity ?? 36,
    };

    try {
      if (editingKelas) {
        const response = await apiRequest<{ message: string; data: BackendClass }>(
          `/classes/${editingKelas.id}`,
          {
            method: 'PUT',
            body: payload,
          }
        );

        setClassMeta((currentMeta) => ({ ...currentMeta, [editingKelas.id]: response.data }));
        setKelas((currentKelas) =>
          currentKelas.map((item) =>
            item.id === editingKelas.id
              ? {
                  ...item,
                  nama: response.data.name,
                  tahunAjaran: response.data.academic_year
                    ? `${response.data.academic_year.name} ${response.data.academic_year.semester}`
                    : '',
                  kelompok: response.data.group_type ?? formData.kelompok,
                  waliKelas: response.data.homeroom_teacher_name ?? '',
                }
              : item
          )
        );
        showToast(response.message, 'success');
      } else {
        const response = await apiRequest<{ message: string; data: BackendClass }>('/classes', {
          method: 'POST',
          body: payload,
        });

        setClassMeta((currentMeta) => ({ ...currentMeta, [response.data.id]: response.data }));
        setKelas((currentKelas) => [
          ...currentKelas,
          {
            id: response.data.id,
            nama: response.data.name,
            tahunAjaran: response.data.academic_year
              ? `${response.data.academic_year.name} ${response.data.academic_year.semester}`
              : '',
            kelompok: response.data.group_type ?? formData.kelompok,
            waliKelas: response.data.homeroom_teacher_name ?? '',
            jumlahSiswa: 0,
          },
        ]);
        showToast(response.message, 'success');
      }

      setShowModal(false);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Gagal menyimpan data kelas.',
        'error'
      );
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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Kelas</h2>
          <p className="mt-1 text-gray-600">Kelola daftar kelas, wali kelas, dan kapasitas siswa</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 rounded-lg bg-[#2563EB] px-6 py-3 font-medium text-white shadow-md transition-all hover:bg-blue-700"
        >
          <Plus size={20} />
          <span>Tambah Kelas</span>
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="relative">
            <Search size={20} className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari kelas, kelompok, atau wali kelas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 outline-none focus:border-transparent focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>
          <select
            value={filterTahunAjaran}
            onChange={(e) => setFilterTahunAjaran(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none"
          >
            {tahunAjaranList.map((tahunAjaran) => (
              <option key={tahunAjaran} value={tahunAjaran}>
                {tahunAjaran === 'all' ? 'Semua Tahun Ajaran' : tahunAjaran}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500">
            Memuat data kelas dari backend...
          </div>
        ) : filteredKelas.length === 0 ? (
          <EmptyState message="Tidak ada data kelas" description="Silakan tambahkan kelas baru" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Kelas</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Kelompok</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Wali Kelas</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Jumlah Siswa</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredKelas.map((item) => (
                  <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="transition-colors hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{item.nama}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`rounded-full px-3 py-1 font-medium ${
                          item.kelompok === 'Ikhwan'
                            ? 'bg-sky-100 text-sky-700'
                            : 'bg-pink-100 text-pink-700'
                        }`}
                      >
                        {item.kelompok}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{item.waliKelas}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 font-medium text-blue-700">
                        <Users size={14} />
                        {jumlahSiswaByKelas[item.nama] ?? 0} siswa
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl rounded-xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b px-6 py-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingKelas ? 'Edit Data Kelas' : 'Tambah Data Kelas'}
                </h3>
                <button onClick={() => setShowModal(false)}>
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Kelas</label>
                    <input
                      type="text"
                      required
                      value={formData.nama}
                      onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Tahun Ajaran</label>
                    <select
                      value={formData.tahunAjaran}
                      onChange={(e) => setFormData({ ...formData, tahunAjaran: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-[#2563EB]"
                    >
                      {tahunAjaranList.filter((item) => item !== 'all').map((tahunAjaran) => (
                        <option key={tahunAjaran} value={tahunAjaran}>
                          {tahunAjaran}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Kelompok</label>
                    <select
                      value={formData.kelompok}
                      onChange={(e) =>
                        setFormData({ ...formData, kelompok: e.target.value as 'Ikhwan' | 'Akhwat' })
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-[#2563EB]"
                    >
                      <option value="Ikhwan">Ikhwan</option>
                      <option value="Akhwat">Akhwat</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Wali Kelas</label>
                    <select
                      value={formData.waliKelas}
                      onChange={(e) => setFormData({ ...formData, waliKelas: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-[#2563EB]"
                    >
                      {waliKelasOptions.map((item) => (
                        <option key={item.id} value={item.nama}>
                          {item.nama}
                        </option>
                      ))}
                    </select>
                    {waliKelasOptions.length === 0 && (
                      <p className="mt-2 text-sm text-red-500">
                        Tambahkan guru dengan role Wali Kelas di menu Data Guru terlebih dahulu.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 border-t pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 rounded-lg border-2 border-gray-300 px-6 py-3 transition-colors hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-[#2563EB] px-6 py-3 text-white transition-colors hover:bg-blue-700"
                  >
                    {editingKelas ? 'Update' : 'Simpan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
