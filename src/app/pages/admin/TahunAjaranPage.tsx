'use client';

import { useEffect, useState } from 'react';
import { Search, Plus, Edit, Trash2, X, CalendarRange, CheckCircle2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { EmptyState } from '../../components/dashboard/EmptyState';
import { Toast, useToast } from '../../components/dashboard/Toast';
import {
  defaultTahunAjaranData,
  TAHUN_AJARAN_STORAGE_KEY,
  type TahunAjaranItem as TahunAjaran,
} from '../../lib/tahunAjaranStore';

export default function TahunAjaranPage() {
  const [tahunAjaran, setTahunAjaran] = useState<TahunAjaran[]>(defaultTahunAjaranData);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<TahunAjaran | null>(null);
  const { toasts, showToast, removeToast } = useToast();

  const [formData, setFormData] = useState({
    nama: '',
    semester: 'Ganjil' as 'Ganjil' | 'Genap',
    tanggalMulai: '',
    tanggalSelesai: '',
    status: 'Draft' as 'Aktif' | 'Draft' | 'Arsip',
  });

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
      const parsedData = JSON.parse(storedData) as TahunAjaran[];
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        setTahunAjaran(parsedData);
      }
    } catch {
      window.localStorage.setItem(
        TAHUN_AJARAN_STORAGE_KEY,
        JSON.stringify(defaultTahunAjaranData)
      );
    }
  }, []);

  const syncTahunAjaran = (nextTahunAjaran: TahunAjaran[]) => {
    setTahunAjaran(nextTahunAjaran);
    window.localStorage.setItem(TAHUN_AJARAN_STORAGE_KEY, JSON.stringify(nextTahunAjaran));
  };

  const filteredData = tahunAjaran.filter(
    (item) =>
      item.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.semester.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      nama: '',
      semester: 'Ganjil',
      tanggalMulai: '',
      tanggalSelesai: '',
      status: 'Draft',
    });
  };

  const handleAdd = () => {
    setEditingItem(null);
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (item: TahunAjaran) => {
    setEditingItem(item);
    setFormData({
      nama: item.nama,
      semester: item.semester,
      tanggalMulai: item.tanggalMulai,
      tanggalSelesai: item.tanggalSelesai,
      status: item.status,
    });
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus tahun ajaran ini?')) {
      syncTahunAjaran(tahunAjaran.filter((item) => item.id !== id));
      showToast('Tahun ajaran berhasil dihapus!', 'success');
    }
  };

  const handleSetActive = (id: number) => {
    syncTahunAjaran(
      tahunAjaran.map((item) => ({
        ...item,
        status: item.id === id ? 'Aktif' : item.status === 'Aktif' ? 'Arsip' : item.status,
      }))
    );
    showToast('Tahun ajaran aktif berhasil diperbarui!', 'success');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingItem) {
      syncTahunAjaran(
        tahunAjaran.map((item) =>
          item.id === editingItem.id ? { ...formData, id: item.id } : item
        )
      );
      showToast('Tahun ajaran berhasil diperbarui!', 'success');
    } else {
      syncTahunAjaran([...tahunAjaran, { ...formData, id: Date.now() }]);
      showToast('Tahun ajaran berhasil ditambahkan!', 'success');
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
          <h2 className="text-2xl font-bold text-gray-900">Tahun Ajaran</h2>
          <p className="mt-1 text-gray-600">Kelola periode akademik aktif, draft, dan arsip</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 rounded-lg bg-[#2563EB] px-6 py-3 font-medium text-white shadow-md transition-all hover:bg-blue-700"
        >
          <Plus size={20} />
          <span>Tambah Tahun Ajaran</span>
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="relative">
          <Search size={20} className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Cari tahun ajaran, semester, atau status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 outline-none focus:border-transparent focus:ring-2 focus:ring-[#2563EB]"
          />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        {filteredData.length === 0 ? (
          <EmptyState message="Tidak ada data tahun ajaran" description="Silakan tambahkan periode baru" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Periode</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Semester</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Tanggal</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold uppercase text-gray-600">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredData.map((item) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="transition-colors hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{item.nama}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{item.semester}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {item.tanggalMulai} s/d {item.tanggalSelesai}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`rounded-full px-3 py-1 font-medium ${
                          item.status === 'Aktif'
                            ? 'bg-green-100 text-green-700'
                            : item.status === 'Draft'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {item.status !== 'Aktif' && (
                          <button
                            onClick={() => handleSetActive(item.id)}
                            className="rounded-lg p-2 text-green-600 transition-colors hover:bg-green-50"
                            title="Jadikan Aktif"
                          >
                            <CheckCircle2 size={18} />
                          </button>
                        )}
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
                  {editingItem ? 'Edit Tahun Ajaran' : 'Tambah Tahun Ajaran'}
                </h3>
                <button onClick={() => setShowModal(false)}>
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Nama Tahun Ajaran</label>
                    <div className="relative">
                      <CalendarRange size={18} className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        required
                        placeholder="Contoh: 2026/2027"
                        value={formData.nama}
                        onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 outline-none focus:ring-2 focus:ring-[#2563EB]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Semester</label>
                    <select
                      value={formData.semester}
                      onChange={(e) =>
                        setFormData({ ...formData, semester: e.target.value as 'Ganjil' | 'Genap' })
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-[#2563EB]"
                    >
                      <option value="Ganjil">Ganjil</option>
                      <option value="Genap">Genap</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Tanggal Mulai</label>
                    <input
                      type="date"
                      required
                      value={formData.tanggalMulai}
                      onChange={(e) => setFormData({ ...formData, tanggalMulai: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">Tanggal Selesai</label>
                    <input
                      type="date"
                      required
                      value={formData.tanggalSelesai}
                      onChange={(e) => setFormData({ ...formData, tanggalSelesai: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as 'Aktif' | 'Draft' | 'Arsip',
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-[#2563EB]"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Aktif">Aktif</option>
                      <option value="Arsip">Arsip</option>
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
                    {editingItem ? 'Update' : 'Simpan'}
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
