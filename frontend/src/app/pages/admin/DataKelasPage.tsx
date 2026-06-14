'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Edit, Trash2, X, Users, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DeleteConfirmationDialog } from '../../components/dashboard/DeleteConfirmationDialog';
import { EmptyState } from '../../components/dashboard/EmptyState';
import { PaginationControls } from '../../components/dashboard/PaginationControls';
import { Toast, useToast } from '../../components/dashboard/Toast';
import { ApiError, apiDelete, apiGet, apiPost, apiPut } from '../../lib/apiClient';
import { defaultKelasData, type KelasItem as Kelas } from '../../lib/kelasStore';
import { defaultGuruData, type GuruItem } from '../../lib/guruStore';
import { defaultSiswaData, type StudentItem } from '../../lib/siswaStore';
import {
  defaultTahunAjaranData,
  tahunAjaranOptionLabel,
  tahunAjaranOptionValue,
  type TahunAjaranItem,
} from '../../lib/tahunAjaranStore';

export default function DataKelasPage() {
  const [kelas, setKelas] = useState<Kelas[]>(defaultKelasData);
  const [waliKelasOptions, setWaliKelasOptions] = useState<GuruItem[]>(
    defaultGuruData.filter((item) => item.role.includes('Wali Kelas'))
  );
  const [students, setStudents] = useState<StudentItem[]>(defaultSiswaData);
  const [filterTahunAjaran, setFilterTahunAjaran] = useState('');
  const [tahunAjaranOptions, setTahunAjaranOptions] = useState<TahunAjaranItem[]>(
    defaultTahunAjaranData
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingKelas, setEditingKelas] = useState<Kelas | null>(null);
  const [selectedKelas, setSelectedKelas] = useState<Kelas | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { toasts, showToast, removeToast } = useToast();

  const [formData, setFormData] = useState({
    nama: '',
    tahunAjaran: '',
    kelompok: 'Ikhwan' as 'Ikhwan' | 'Akhwat',
    waliKelas: '',
    jumlahSiswa: 0,
  });

  useEffect(() => {
    void apiGet<Kelas[]>('/api/school-classes')
      .then(setKelas)
      .catch(() => showToast('Gagal memuat data kelas dari backend.', 'error'));
  }, []);

  useEffect(() => {
    void apiGet<TahunAjaranItem[]>('/api/academic-years')
      .then(setTahunAjaranOptions)
      .catch(() => showToast('Gagal memuat tahun ajaran dari backend.', 'error'));
  }, []);

  useEffect(() => {
    void apiGet<GuruItem[]>('/api/teachers')
      .then((items) => setWaliKelasOptions(items.filter((item) => item.role.includes('Wali Kelas'))))
      .catch(() => showToast('Gagal memuat data wali kelas dari backend.', 'error'));
  }, []);

  useEffect(() => {
    void apiGet<StudentItem[]>('/api/students')
      .then(setStudents)
      .catch(() => showToast('Gagal memuat data siswa dari backend.', 'error'));
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
    () =>
      tahunAjaranOptions.map((item) => ({
        value: tahunAjaranOptionValue(item),
        label: tahunAjaranOptionLabel(item),
      })),
    [tahunAjaranOptions]
  );

  const filteredKelas = kelas.filter((item) => {
    const matchesSearch =
      item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.kelompok.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.waliKelas ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTahunAjaran =
      filterTahunAjaran !== '' && item.tahunAjaran === filterTahunAjaran;
    return matchesSearch && matchesTahunAjaran;
  });
  const totalPages = Math.ceil(filteredKelas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedKelas = filteredKelas.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterTahunAjaran, searchQuery]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const selectedKelasStudents = useMemo(() => {
    if (selectedKelas === null) {
      return [];
    }

    return students
      .filter(
        (student) =>
          student.kelas === selectedKelas.nama &&
          student.tahunAjaran === selectedKelas.tahunAjaran
      )
      .sort((first, second) => first.nama.localeCompare(second.nama));
  }, [selectedKelas, students]);

  const handleAdd = () => {
    if (tahunAjaranList.length === 0) {
      showToast('Tambahkan tahun ajaran terlebih dahulu sebelum membuat kelas.', 'error');
      return;
    }

    setEditingKelas(null);
    setFormData({
      nama: '',
      tahunAjaran: '',
      kelompok: 'Ikhwan',
      waliKelas: '',
      jumlahSiswa: 0,
    });
    setShowModal(true);
  };

  const handleEdit = (item: Kelas) => {
    setEditingKelas(item);
    setFormData({
      nama: item.nama,
      tahunAjaran: item.tahunAjaran,
      kelompok: item.kelompok,
      waliKelas: item.waliKelas,
      jumlahSiswa: item.jumlahSiswa,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await apiDelete(`/api/school-classes/${id}`);
      setKelas((current) => current.filter((item) => item.id !== id));
      showToast('Data kelas berhasil dihapus!', 'success');
    } catch {
      showToast('Gagal menghapus data kelas.', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSaving) {
      return;
    }

    if (!formData.tahunAjaran) {
      showToast('Tahun ajaran wajib dipilih sebelum menyimpan kelas.', 'error');
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        ...formData,
        nama: formData.nama.trim(),
        tahunAjaran: formData.tahunAjaran.trim(),
        waliKelas: formData.waliKelas.trim(),
      };

      if (editingKelas) {
        const updatedKelas = await apiPut<Kelas>(
          `/api/school-classes/${editingKelas.id}`,
          payload
        );
        setKelas((current) => upsertKelas(current, updatedKelas));
        showToast('Data kelas berhasil diperbarui!', 'success');
      } else {
        const newKelas = await apiPost<Kelas>('/api/school-classes', payload);
        setKelas((current) => upsertKelas(current, newKelas));
        showToast('Data kelas berhasil ditambahkan!', 'success');
      }
      setShowModal(false);
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Gagal menyimpan data kelas.'), 'error');
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

      <div className="flex justify-end">
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
            <option value="" disabled>
              Pilih Tahun Ajaran
            </option>
            {tahunAjaranList.map((tahunAjaran) => (
              <option key={tahunAjaran.value} value={tahunAjaran.value}>
                {tahunAjaran.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {filteredKelas.length === 0 ? (
          <EmptyState
            message={filterTahunAjaran ? 'Tidak ada data kelas' : 'Pilih tahun ajaran'}
            description={
              filterTahunAjaran
                ? 'Silakan tambahkan kelas baru'
                : 'Data kelas akan tampil setelah tahun ajaran dipilih'
            }
          />
        ) : (
          <>
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
                  {paginatedKelas.map((item) => (
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
                            onClick={() => setSelectedKelas(item)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Lihat Siswa"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleEdit(item)}
                            className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                          >
                            <Edit size={18} />
                          </button>
                          <DeleteConfirmationDialog
                            title="Hapus Data Kelas?"
                            description="Data kelas akan dihapus dari aplikasi dan database. Tindakan ini tidak bisa dibatalkan."
                            itemName={`${item.nama} - ${item.tahunAjaran}`}
                            onConfirm={() => handleDelete(item.id)}
                          >
                            <button className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50">
                              <Trash2 size={18} />
                            </button>
                          </DeleteConfirmationDialog>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationControls
              currentPage={currentPage}
              totalItems={filteredKelas.length}
              itemsPerPage={itemsPerPage}
              itemLabel="kelas"
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      <AnimatePresence>
        {selectedKelas && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setSelectedKelas(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl rounded-xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b px-6 py-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Siswa Kelas {selectedKelas.nama}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {selectedKelas.tahunAjaran} - {selectedKelasStudents.length} siswa
                  </p>
                </div>
                <button onClick={() => setSelectedKelas(null)}>
                  <X size={24} />
                </button>
              </div>

              <div className="p-6">
                {selectedKelasStudents.length === 0 ? (
                  <EmptyState
                    message="Belum ada siswa"
                    description="Tidak ada siswa yang terdaftar pada kelas ini"
                  />
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full">
                      <thead className="border-b border-gray-200 bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                            NIS
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                            Nama Siswa
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                            Jenis Kelamin
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                            Kontak
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedKelasStudents.map((student) => (
                          <tr key={student.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {student.nis}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {student.nama}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {student.jenisKelamin}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              <div>{student.email || '-'}</div>
                              <div className="text-xs text-gray-500">{student.telepon || '-'}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

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
                      <option value="" disabled>
                        Pilih tahun ajaran
                      </option>
                      {tahunAjaranList.map((tahunAjaran) => (
                        <option key={tahunAjaran.value} value={tahunAjaran.value}>
                          {tahunAjaran.label}
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
                      <option value="">
                        Pilih wali kelas
                      </option>
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

const upsertKelas = (items: Kelas[], nextItem: Kelas) => {
  if (items.some((item) => item.id === nextItem.id)) {
    return items.map((item) => (item.id === nextItem.id ? nextItem : item));
  }

  return [...items, nextItem];
};

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (! (error instanceof ApiError)) {
    return fallback;
  }

  if (
    typeof error.payload === 'object' &&
    error.payload !== null &&
    'errors' in error.payload
  ) {
    const errors = (error.payload as { errors?: Record<string, string[]> }).errors;
    const firstError = errors ? Object.values(errors)[0]?.[0] : null;

    if (firstError) {
      return firstError;
    }
  }

  return error.message || fallback;
};
