'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Edit, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EmptyState } from '../../components/dashboard/EmptyState';
import { useToast, Toast } from '../../components/dashboard/Toast';
import { defaultGuruData, GURU_STORAGE_KEY, type GuruItem as Guru } from '../../lib/guruStore';
import {
  defaultTahunAjaranData,
  TAHUN_AJARAN_STORAGE_KEY,
  type TahunAjaranItem,
} from '../../lib/tahunAjaranStore';

const roleOptions: Array<'Wali Kelas' | 'Guru Mapel'> = ['Wali Kelas', 'Guru Mapel'];

export default function DataGuruPage() {
  const [guru, setGuru] = useState<Guru[]>(defaultGuruData);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTahunAjaran, setFilterTahunAjaran] = useState('all');
  const [tahunAjaranOptions, setTahunAjaranOptions] = useState<TahunAjaranItem[]>(
    defaultTahunAjaranData
  );
  const [showModal, setShowModal] = useState(false);
  const [editingGuru, setEditingGuru] = useState<Guru | null>(null);
  const { toasts, showToast, removeToast } = useToast();

  const [formData, setFormData] = useState({
    nip: '',
    nama: '',
    tahunAjaran: '2025/2026 Genap',
    role: ['Guru Mapel'] as ('Wali Kelas' | 'Guru Mapel')[],
    email: '',
    telepon: '',
    status: 'Aktif' as 'Aktif' | 'Cuti',
  });

  useEffect(() => {
    const storedData = window.localStorage.getItem(GURU_STORAGE_KEY);
    if (!storedData) {
      window.localStorage.setItem(GURU_STORAGE_KEY, JSON.stringify(defaultGuruData));
      return;
    }

    try {
      const parsedData = JSON.parse(storedData) as Guru[];
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        setGuru(parsedData);
      }
    } catch {
      window.localStorage.setItem(GURU_STORAGE_KEY, JSON.stringify(defaultGuruData));
    }
  }, []);

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

  const syncGuru = (nextGuru: Guru[]) => {
    setGuru(nextGuru);
    window.localStorage.setItem(GURU_STORAGE_KEY, JSON.stringify(nextGuru));
  };

  const filteredGuru = guru.filter((g) => {
    const matchesSearch =
      g.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.nip.includes(searchQuery) ||
      g.role.some((role) => role.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTahunAjaran =
      filterTahunAjaran === 'all' || g.tahunAjaran === filterTahunAjaran;
    return matchesSearch && matchesTahunAjaran;
  });

  const handleAdd = () => {
    setEditingGuru(null);
    setFormData({
      nip: '',
      nama: '',
      tahunAjaran: tahunAjaranList[1] ?? '2025/2026 Genap',
      role: ['Guru Mapel'],
      email: '',
      telepon: '',
      status: 'Aktif',
    });
    setShowModal(true);
  };

  const handleEdit = (g: Guru) => {
    setEditingGuru(g);
    setFormData(g);
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus data guru ini?')) {
      syncGuru(guru.filter((g) => g.id !== id));
      showToast('Data guru berhasil dihapus!', 'success');
    }
  };

  const handleRoleToggle = (selectedRole: 'Wali Kelas' | 'Guru Mapel') => {
    const currentRoles = formData.role;
    const hasRole = currentRoles.includes(selectedRole);

    if (hasRole) {
      if (currentRoles.length === 1) {
        return;
      }
      setFormData({
        ...formData,
        role: currentRoles.filter((role) => role !== selectedRole),
      });
      return;
    }

    setFormData({
      ...formData,
      role: [...currentRoles, selectedRole],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGuru) {
      syncGuru(guru.map((g) => (g.id === editingGuru.id ? { ...formData, id: g.id } : g)));
      showToast('Data guru berhasil diupdate!', 'success');
    } else {
      const newGuru = { ...formData, id: Date.now() };
      syncGuru([...guru, newGuru]);
      showToast('Guru baru berhasil ditambahkan!', 'success');
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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Guru</h2>
          <p className="text-gray-600 mt-1">Kelola data guru dan akses fitur yang diberikan</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-[#2563EB] text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all font-medium shadow-md"
        >
          <Plus size={20} />
          <span>Tambah Guru</span>
        </button>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="relative">
          <Search
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Cari guru (nama, NIP, atau akses)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none"
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredGuru.length === 0 ? (
          <EmptyState message="Tidak ada data guru" description="Silakan tambahkan guru baru" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    NIP
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Nama
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Akses
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Kontak
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredGuru.map((g) => (
                  <motion.tr
                    key={g.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{g.nip}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{g.nama}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex flex-wrap gap-2">
                        {g.role.map((role) => (
                          <span
                            key={role}
                            className={`px-3 py-1 rounded-full font-medium ${
                              role === 'Wali Kelas'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-indigo-100 text-indigo-700'
                            }`}
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div>{g.email}</div>
                      <div className="text-xs text-gray-500">{g.telepon}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full font-medium ${
                          g.status === 'Aktif'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {g.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(g)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(g.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl max-w-2xl w-full"
            >
              <div className="border-b px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingGuru ? 'Edit Guru' : 'Tambah Guru Baru'}
                </h3>
                <button onClick={() => setShowModal(false)}>
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      NIP
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nip}
                      onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nama Lengkap
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.nama}
                      onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tahun Ajaran
                    </label>
                    <select
                      value={formData.tahunAjaran}
                      onChange={(e) => setFormData({ ...formData, tahunAjaran: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] outline-none"
                    >
                      {tahunAjaranList.filter((item) => item !== 'all').map((tahunAjaran) => (
                        <option key={tahunAjaran} value={tahunAjaran}>
                          {tahunAjaran}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Akses Guru
                    </label>
                    <div className="flex flex-wrap gap-2 rounded-lg border border-gray-300 px-3 py-2">
                      {roleOptions.map((role) => {
                        const isSelected = formData.role.includes(role);
                        return (
                          <button
                            key={role}
                            type="button"
                            onClick={() => handleRoleToggle(role)}
                            className={`rounded-full px-3 py-1 text-sm font-medium transition-all ${
                              isSelected
                                ? 'bg-[#2563EB] text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {role}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Guru dapat memiliki lebih dari satu akses.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value as 'Aktif' | 'Cuti' })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] outline-none"
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Cuti">Cuti</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telepon
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.telepon}
                      onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-[#2563EB] text-white rounded-lg hover:bg-blue-700"
                  >
                    {editingGuru ? 'Update' : 'Simpan'}
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
