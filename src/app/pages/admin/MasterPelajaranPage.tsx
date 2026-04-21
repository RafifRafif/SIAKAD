'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Edit, Trash2, X, BookOpen } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { EmptyState } from '../../components/dashboard/EmptyState';
import { Toast, useToast } from '../../components/dashboard/Toast';
import {
  defaultMasterPelajaran,
  MASTER_PELAJARAN_STORAGE_KEY,
  type MasterPelajaran,
} from '../../lib/pelajaranStore';
import {
  defaultTahunAjaranData,
  TAHUN_AJARAN_STORAGE_KEY,
  type TahunAjaranItem,
} from '../../lib/tahunAjaranStore';

export default function MasterPelajaranPage() {
  const [pelajaran, setPelajaran] = useState<MasterPelajaran[]>(defaultMasterPelajaran);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTahunAjaran, setFilterTahunAjaran] = useState('all');
  const [tahunAjaranOptions, setTahunAjaranOptions] = useState<TahunAjaranItem[]>(
    defaultTahunAjaranData
  );
  const [showModal, setShowModal] = useState(false);
  const [editingPelajaran, setEditingPelajaran] = useState<MasterPelajaran | null>(null);
  const [formData, setFormData] = useState({
    nama: '',
    tahunAjaran: '2025/2026 Genap',
  });
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    const storedData = window.localStorage.getItem(MASTER_PELAJARAN_STORAGE_KEY);
    if (!storedData) {
      window.localStorage.setItem(
        MASTER_PELAJARAN_STORAGE_KEY,
        JSON.stringify(defaultMasterPelajaran)
      );
      return;
    }

    try {
      const parsedData = JSON.parse(storedData) as MasterPelajaran[];
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        setPelajaran(parsedData);
      }
    } catch {
      window.localStorage.setItem(
        MASTER_PELAJARAN_STORAGE_KEY,
        JSON.stringify(defaultMasterPelajaran)
      );
    }
  }, []);

  const syncPelajaran = (nextPelajaran: MasterPelajaran[]) => {
    setPelajaran(nextPelajaran);
    window.localStorage.setItem(MASTER_PELAJARAN_STORAGE_KEY, JSON.stringify(nextPelajaran));
  };

  useEffect(() => {
    const storedData = window.localStorage.getItem(TAHUN_AJARAN_STORAGE_KEY);
    if (!storedData) {
      window.localStorage.setItem(
        TAHUN_AJARAN_STORAGE_KEY,
        JSON.stringify(defaultTahunAjaranData)
      );
      return;
    }

    try {
      const parsedData = JSON.parse(storedData) as TahunAjaranItem[];
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        setTahunAjaranOptions(parsedData);
      }
    } catch {
      window.localStorage.setItem(
        TAHUN_AJARAN_STORAGE_KEY,
        JSON.stringify(defaultTahunAjaranData)
      );
    }
  }, []);

  const tahunAjaranList = useMemo(
    () => ['all', ...tahunAjaranOptions.map((item) => `${item.nama} ${item.semester}`)],
    [tahunAjaranOptions]
  );

  const filteredPelajaran = pelajaran.filter(
    (item) =>
      item.nama.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (filterTahunAjaran === 'all' || item.tahunAjaran === filterTahunAjaran)
  );

  const handleAdd = () => {
    setEditingPelajaran(null);
    setFormData({
      nama: '',
      tahunAjaran: tahunAjaranList[1] ?? '2025/2026 Genap',
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

  const handleDelete = (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus data pelajaran ini?')) {
      const nextPelajaran = pelajaran.filter((item) => item.id !== id);
      syncPelajaran(nextPelajaran);
      showToast('Data pelajaran berhasil dihapus!', 'success');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedNama = formData.nama.trim();
    if (!trimmedNama) {
      showToast('Nama pelajaran wajib diisi!', 'error');
      return;
    }

    const duplicatePelajaran = pelajaran.some(
      (item) =>
        item.nama.toLowerCase() === trimmedNama.toLowerCase() &&
        item.id !== editingPelajaran?.id
    );
    if (duplicatePelajaran) {
      showToast('Nama pelajaran sudah ada!', 'error');
      return;
    }

    if (editingPelajaran) {
      const nextPelajaran = pelajaran.map((item) =>
        item.id === editingPelajaran.id
          ? { ...item, nama: trimmedNama, tahunAjaran: formData.tahunAjaran }
          : item
      );
      syncPelajaran(nextPelajaran);
      showToast('Data pelajaran berhasil diperbarui!', 'success');
    } else {
      const nextPelajaran = [
        ...pelajaran,
        { id: Date.now(), nama: trimmedNama, tahunAjaran: formData.tahunAjaran },
      ];
      syncPelajaran(nextPelajaran);
      showToast('Data pelajaran berhasil ditambahkan!', 'success');
    }

    setShowModal(false);
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
          <h2 className="text-2xl font-bold text-gray-900">Data Pelajaran</h2>
          <p className="mt-1 text-gray-600">
            Kelola master nama pelajaran yang dipakai di data pembelajaran
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 rounded-lg bg-[#2563EB] px-6 py-3 font-medium text-white shadow-md transition-all hover:bg-blue-700"
        >
          <Plus size={20} />
          <span>Tambah Pelajaran</span>
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="relative">
          <Search size={20} className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama pelajaran..."
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
        {filteredPelajaran.length === 0 ? (
          <EmptyState
            message="Tidak ada data pelajaran"
            description="Silakan tambahkan master pelajaran baru"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">
                    Nama Pelajaran
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase text-gray-600">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPelajaran.map((item) => (
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
              className="w-full max-w-xl rounded-xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b px-6 py-4">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingPelajaran ? 'Edit Data Pelajaran' : 'Tambah Data Pelajaran'}
                </h3>
                <button onClick={() => setShowModal(false)}>
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 p-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Nama Pelajaran
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
                    {tahunAjaranList.filter((item) => item !== 'all').map((tahunAjaran) => (
                      <option key={tahunAjaran} value={tahunAjaran}>
                        {tahunAjaran}
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
