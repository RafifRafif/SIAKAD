'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Edit, Trash2, X, BookOpen } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { DeleteConfirmationDialog } from '../../components/dashboard/DeleteConfirmationDialog';
import { EmptyState } from '../../components/dashboard/EmptyState';
import { PaginationControls } from '../../components/dashboard/PaginationControls';
import { Toast, useToast } from '../../components/dashboard/Toast';
import { ApiError, apiDelete, apiGet, apiPost, apiPut } from '../../lib/apiClient';
import {
  defaultMasterPelajaran,
  type MasterPelajaran,
} from '../../lib/pelajaranStore';
import {
  defaultTahunAjaranData,
  tahunAjaranOptionLabel,
  tahunAjaranOptionValue,
  type TahunAjaranItem,
} from '../../lib/tahunAjaranStore';

export default function MasterPelajaranPage() {
  const [pelajaran, setPelajaran] = useState<MasterPelajaran[]>(defaultMasterPelajaran);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTahunAjaran, setFilterTahunAjaran] = useState('');
  const [tahunAjaranOptions, setTahunAjaranOptions] = useState<TahunAjaranItem[]>(
    defaultTahunAjaranData
  );
  const [showModal, setShowModal] = useState(false);
  const [editingPelajaran, setEditingPelajaran] = useState<MasterPelajaran | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [formData, setFormData] = useState({
    nama: '',
    tahunAjaran: '',
  });
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    void apiGet<MasterPelajaran[]>('/api/subjects')
      .then((items) => setPelajaran(dedupePelajaran(items)))
      .catch(() => showToast('Gagal memuat data mata pelajaran dari backend.', 'error'));
  }, []);

  useEffect(() => {
    void apiGet<TahunAjaranItem[]>('/api/academic-years')
      .then(setTahunAjaranOptions)
      .catch(() => showToast('Gagal memuat tahun ajaran dari backend.', 'error'));
  }, []);

  const tahunAjaranList = useMemo(
    () =>
      tahunAjaranOptions.map((item) => ({
        value: tahunAjaranOptionValue(item),
        label: tahunAjaranOptionLabel(item),
      })),
    [tahunAjaranOptions]
  );

  const filteredPelajaran = pelajaran.filter(
    (item) =>
      item.nama.toLowerCase().includes(searchQuery.toLowerCase()) &&
      filterTahunAjaran !== '' &&
      item.tahunAjaran === filterTahunAjaran
  );
  const totalPages = Math.ceil(filteredPelajaran.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPelajaran = filteredPelajaran.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterTahunAjaran, searchQuery]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleAdd = () => {
    setEditingPelajaran(null);
    setFormData({
      nama: '',
      tahunAjaran: '',
    });
    setShowModal(true);
  };

  const handleEdit = (item: MasterPelajaran) => {
    setEditingPelajaran(item);
    setFormData({
      nama: item.nama,
      tahunAjaran: item.tahunAjaran,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await apiDelete(`/api/subjects/${id}`);
      setPelajaran((current) => current.filter((item) => item.id !== id));
      showToast('Data mata pelajaran berhasil dihapus!', 'success');
    } catch {
      showToast('Gagal menghapus data mata pelajaran.', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSaving) {
      return;
    }

    const trimmedNama = formData.nama.trim();
    if (!trimmedNama) {
      showToast('Nama mata pelajaran wajib diisi!', 'error');
      return;
    }

    if (!formData.tahunAjaran) {
      showToast('Tahun ajaran wajib dipilih!', 'error');
      return;
    }

    const duplicatePelajaran = pelajaran.some(
      (item) =>
        item.nama.toLowerCase() === trimmedNama.toLowerCase() &&
        item.tahunAjaran === formData.tahunAjaran &&
        item.id !== editingPelajaran?.id
    );
    if (duplicatePelajaran) {
      showToast('Nama mata pelajaran sudah ada!', 'error');
      return;
    }

    setIsSaving(true);

    try {
      const payload = { nama: trimmedNama, tahunAjaran: formData.tahunAjaran };

      if (editingPelajaran) {
        const updatedPelajaran = await apiPut<MasterPelajaran>(
          `/api/subjects/${editingPelajaran.id}`,
          payload
        );
        setPelajaran((current) => upsertPelajaran(current, updatedPelajaran));
        showToast('Data mata pelajaran berhasil diperbarui!', 'success');
      } else {
        const newPelajaran = await apiPost<MasterPelajaran>('/api/subjects', payload);
        setPelajaran((current) => upsertPelajaran(current, newPelajaran));
        showToast('Data mata pelajaran berhasil ditambahkan!', 'success');
      }

      setShowModal(false);
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Gagal menyimpan data mata pelajaran.'), 'error');
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
          <span>Tambah Mata Pelajaran</span>
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="relative">
          <Search size={20} className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama mata pelajaran..."
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
        {filteredPelajaran.length === 0 ? (
          <EmptyState
            message={filterTahunAjaran ? 'Tidak ada data mata pelajaran' : 'Pilih tahun ajaran'}
            description={
              filterTahunAjaran
                ? 'Silakan tambahkan master mata pelajaran baru'
                : 'Data mata pelajaran akan tampil setelah tahun ajaran dipilih'
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">
                      Nama Mata Pelajaran
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase text-gray-600">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedPelajaran.map((item) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="transition-colors hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{item.nama}</div>
                        <div className="text-xs text-gray-500">{item.tahunAjaran}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="rounded-lg p-2 text-blue-600 transition-colors hover:bg-blue-50"
                          >
                            <Edit size={18} />
                          </button>
                          <DeleteConfirmationDialog
                            title="Hapus Data Mata Pelajaran?"
                            description="Data mata pelajaran akan dihapus dari aplikasi dan database. Tindakan ini tidak bisa dibatalkan."
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
              totalItems={filteredPelajaran.length}
              itemsPerPage={itemsPerPage}
              itemLabel="mata pelajaran"
              onPageChange={setCurrentPage}
            />
          </>
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
              className="w-full max-w-xl rounded-xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b px-6 py-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingPelajaran ? 'Edit Data Mata Pelajaran' : 'Tambah Data Mata Pelajaran'}
                </h3>
                <button onClick={() => setShowModal(false)}>
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 p-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Nama Mata Pelajaran
                  </label>
                  <div className="relative">
                    <BookOpen
                      size={18}
                      className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      required
                      value={formData.nama}
                      onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>
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

const pelajaranKey = (item: Pick<MasterPelajaran, 'nama' | 'tahunAjaran'>) =>
  `${item.nama.trim().toLowerCase()}|${item.tahunAjaran}`;

const dedupePelajaran = (items: MasterPelajaran[]) =>
  Array.from(new Map(items.map((item) => [pelajaranKey(item), item])).values());

const upsertPelajaran = (items: MasterPelajaran[], nextItem: MasterPelajaran) => {
  const key = pelajaranKey(nextItem);

  if (items.some((item) => item.id === nextItem.id || pelajaranKey(item) === key)) {
    return items.map((item) =>
      item.id === nextItem.id || pelajaranKey(item) === key ? nextItem : item
    );
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
