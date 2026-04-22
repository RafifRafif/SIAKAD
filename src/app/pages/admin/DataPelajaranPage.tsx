'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Edit, Trash2, X, BookOpen } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { EmptyState } from '../../components/dashboard/EmptyState';
import { Toast, useToast } from '../../components/dashboard/Toast';
import { apiRequest } from '../../lib/api';
import {
  type GuruItem,
  type KelasItem,
  type MasterPelajaran,
  type TahunAjaranItem,
} from '../../lib/masterDataTypes';

interface Pelajaran {
  id: number;
  nama: string;
  tahunAjaran: string;
  guruPengampu: string;
  kelas: string;
  kelompok: 'Ikhwan' | 'Akhwat';
}

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

interface BackendClass {
  id: number;
  name: string;
}

interface BackendSubject {
  id: number;
  name: string;
  teacher_id: number | null;
  class_id: number | null;
  group_type: 'Ikhwan' | 'Akhwat' | null;
  academic_year?: BackendAcademicYear | null;
  teacher?: BackendTeacher | null;
  school_class?: BackendClass | null;
}

const defaultFormData = {
  nama: '',
  tahunAjaran: '',
  guruPengampu: '',
  kelas: '',
  kelompok: 'Ikhwan' as 'Ikhwan' | 'Akhwat',
};

const mapAcademicYearToOption = (item: BackendAcademicYear): TahunAjaranItem => ({
  id: item.id,
  nama: item.name,
  semester: item.semester,
  tanggalMulai: '',
  tanggalSelesai: '',
  status: item.is_active ? 'Aktif' : 'Draft',
});

const mapTeacherToOption = (item: BackendTeacher): GuruItem => ({
  id: item.id,
  nip: '',
  nama: item.name,
  tahunAjaran: '',
  role: item.roles,
  email: '',
  telepon: '',
  status: 'Aktif',
});

const mapClassToOption = (item: BackendClass): KelasItem => ({
  id: item.id,
  nama: item.name,
  tahunAjaran: '',
  kelompok: 'Ikhwan',
  waliKelas: '',
  jumlahSiswa: 0,
});

const mapSubjectToViewModel = (item: BackendSubject): Pelajaran => ({
  id: item.id,
  nama: item.name,
  tahunAjaran: item.academic_year ? `${item.academic_year.name} ${item.academic_year.semester}` : '',
  guruPengampu: item.teacher?.name ?? '',
  kelas: item.school_class?.name ?? '',
  kelompok: item.group_type ?? 'Ikhwan',
});

export default function DataPelajaranPage() {
  const [pelajaran, setPelajaran] = useState<Pelajaran[]>([]);
  const [masterPelajaran, setMasterPelajaran] = useState<MasterPelajaran[]>([]);
  const [guruMapelOptions, setGuruMapelOptions] = useState<GuruItem[]>([]);
  const [kelasOptions, setKelasOptions] = useState<KelasItem[]>([]);
  const [filterTahunAjaran, setFilterTahunAjaran] = useState('all');
  const [tahunAjaranOptions, setTahunAjaranOptions] = useState<TahunAjaranItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPelajaran, setEditingPelajaran] = useState<Pelajaran | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toasts, showToast, removeToast } = useToast();

  const [formData, setFormData] = useState(defaultFormData);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [subjectsResponse, teachersResponse, classesResponse, academicYearsResponse] =
          await Promise.all([
            apiRequest<{ data: BackendSubject[] }>('/subjects'),
            apiRequest<{ data: BackendTeacher[] }>('/teachers'),
            apiRequest<{ data: BackendClass[] }>('/classes'),
            apiRequest<{ data: BackendAcademicYear[] }>('/academic-years'),
          ]);

        setPelajaran(subjectsResponse.data.map(mapSubjectToViewModel));

        const uniqueMasterPelajaran = Array.from(
          new Map(
            subjectsResponse.data.map((item) => [
              item.name,
              {
                id: item.id,
                nama: item.name,
                tahunAjaran: item.academic_year
                  ? `${item.academic_year.name} ${item.academic_year.semester}`
                  : '',
              },
            ])
          ).values()
        );

        setMasterPelajaran(uniqueMasterPelajaran);
        setGuruMapelOptions(
          teachersResponse.data
            .filter((item) => item.roles.includes('Guru Mapel'))
            .map(mapTeacherToOption)
        );
        setKelasOptions(classesResponse.data.map(mapClassToOption));
        setTahunAjaranOptions(academicYearsResponse.data.map(mapAcademicYearToOption));
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : 'Gagal memuat data pembelajaran dari backend.',
          'error'
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, []);

  const tahunAjaranList = useMemo(
    () => ['all', ...tahunAjaranOptions.map((item) => `${item.nama} ${item.semester}`)],
    [tahunAjaranOptions]
  );

  const filteredPelajaran = pelajaran.filter(
    (item) =>
      item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.guruPengampu.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kelas.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredByTahunAjaran = filteredPelajaran.filter(
    (item) => filterTahunAjaran === 'all' || item.tahunAjaran === filterTahunAjaran
  );

  const handleAdd = () => {
    setEditingPelajaran(null);
    setFormData({
      nama: masterPelajaran[0]?.nama ?? '',
      tahunAjaran: tahunAjaranList[1] ?? '',
      guruPengampu: guruMapelOptions[0]?.nama ?? '',
      kelas: kelasOptions[0]?.nama ?? '',
      kelompok: 'Ikhwan',
    });
    setShowModal(true);
  };

  const handleEdit = (item: Pelajaran) => {
    setEditingPelajaran(item);
    setFormData(item);
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data pembelajaran ini?')) {
      return;
    }

    void (async () => {
      try {
        const response = await apiRequest<{ message: string }>(`/subjects/${id}`, {
          method: 'DELETE',
        });
        setPelajaran((currentItems) => currentItems.filter((item) => item.id !== id));
        showToast(response.message, 'success');
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : 'Gagal menghapus data pembelajaran.',
          'error'
        );
      }
    })();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const academicYearId =
      tahunAjaranOptions.find((item) => `${item.nama} ${item.semester}` === formData.tahunAjaran)
        ?.id ?? null;
    const teacherId = guruMapelOptions.find((item) => item.nama === formData.guruPengampu)?.id ?? null;
    const classId = kelasOptions.find((item) => item.nama === formData.kelas)?.id ?? null;

    const payload = {
      name: formData.nama,
      academic_year_id: academicYearId,
      teacher_id: teacherId,
      class_id: classId,
      group_type: formData.kelompok,
    };

    try {
      if (editingPelajaran) {
        const response = await apiRequest<{ message: string; data: BackendSubject }>(
          `/subjects/${editingPelajaran.id}`,
          {
            method: 'PUT',
            body: payload,
          }
        );

        setPelajaran((currentItems) =>
          currentItems.map((item) =>
            item.id === editingPelajaran.id ? mapSubjectToViewModel(response.data) : item
          )
        );
        showToast(response.message, 'success');
      } else {
        const response = await apiRequest<{ message: string; data: BackendSubject }>('/subjects', {
          method: 'POST',
          body: payload,
        });

        setPelajaran((currentItems) => [...currentItems, mapSubjectToViewModel(response.data)]);
        setMasterPelajaran((currentItems) =>
          currentItems.some((item) => item.nama === response.data.name)
            ? currentItems
            : [
                ...currentItems,
                {
                  id: response.data.id,
                  nama: response.data.name,
                  tahunAjaran: response.data.academic_year
                    ? `${response.data.academic_year.name} ${response.data.academic_year.semester}`
                    : '',
                },
              ]
        );
        showToast(response.message, 'success');
      }

      setShowModal(false);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Gagal menyimpan data pembelajaran.',
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
          <h2 className="text-2xl font-bold text-gray-900">Data Pembelajaran</h2>
          <p className="mt-1 text-gray-600">Kelola daftar pembelajaran, pengampu, kelas, dan kelompok</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 rounded-lg bg-[#2563EB] px-6 py-3 font-medium text-white shadow-md transition-all hover:bg-blue-700"
        >
          <Plus size={20} />
          <span>Tambah Pembelajaran</span>
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="relative">
            <Search size={20} className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari pelajaran, guru pengampu, atau kelas..."
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
            Memuat data pembelajaran dari backend...
          </div>
        ) : filteredByTahunAjaran.length === 0 ? (
          <EmptyState message="Tidak ada data pembelajaran" description="Silakan tambahkan pembelajaran baru" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Pelajaran</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Guru Pengampu</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Kelas</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Kelompok</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredByTahunAjaran.map((item) => (
                  <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="transition-colors hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{item.nama}</div>
                      <div className="text-xs text-gray-500">{item.tahunAjaran}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{item.guruPengampu}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{item.kelas}</td>
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
                  {editingPelajaran ? 'Edit Data Pembelajaran' : 'Tambah Data Pembelajaran'}
                </h3>
                <button onClick={() => setShowModal(false)}>
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 p-6">
                <div className="grid gap-4 md:grid-cols-2">
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
                    <label className="mb-2 block text-sm font-medium text-gray-700">Nama Pelajaran</label>
                    <div className="relative">
                      <BookOpen size={18} className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                      <select
                        value={formData.nama}
                        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 outline-none focus:ring-2 focus:ring-[#2563EB]"
                      >
                        {masterPelajaran.map((item) => (
                          <option key={item.id} value={item.nama}>
                            {item.nama}
                          </option>
                        ))}
                      </select>
                    </div>
                    {masterPelajaran.length === 0 && (
                      <p className="mt-2 text-sm text-red-500">
                        Tambahkan data di menu Data Pelajaran terlebih dahulu.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Guru Pengampu</label>
                    <select
                      value={formData.guruPengampu}
                      onChange={(e) => setFormData({ ...formData, guruPengampu: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-[#2563EB]"
                    >
                      {guruMapelOptions.map((item) => (
                        <option key={item.id} value={item.nama}>
                          {item.nama}
                        </option>
                      ))}
                    </select>
                    {guruMapelOptions.length === 0 && (
                      <p className="mt-2 text-sm text-red-500">
                        Tambahkan guru dengan role Guru Mapel di menu Data Guru terlebih dahulu.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Kelas</label>
                    <select
                      value={formData.kelas}
                      onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-[#2563EB]"
                    >
                      {kelasOptions.map((item) => (
                        <option key={item.id} value={item.nama}>
                          {item.nama}
                        </option>
                      ))}
                    </select>
                    {kelasOptions.length === 0 && (
                      <p className="mt-2 text-sm text-red-500">
                        Tambahkan data di menu Data Kelas terlebih dahulu.
                      </p>
                    )}
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
                    {editingPelajaran ? 'Update' : 'Simpan'}
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
