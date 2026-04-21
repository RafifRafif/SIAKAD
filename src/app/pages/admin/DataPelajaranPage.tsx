'use client';

import { useEffect, useState } from 'react';
import { Search, Plus, Edit, Trash2, X, BookOpen } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { EmptyState } from '../../components/dashboard/EmptyState';
import { Toast, useToast } from '../../components/dashboard/Toast';
import {
  defaultMasterPelajaran,
  MASTER_PELAJARAN_STORAGE_KEY,
  type MasterPelajaran,
} from '../../lib/pelajaranStore';
import { defaultGuruData, GURU_STORAGE_KEY, type GuruItem } from '../../lib/guruStore';
import { defaultKelasData, KELAS_STORAGE_KEY, type KelasItem } from '../../lib/kelasStore';
import {
  defaultTahunAjaranData,
  TAHUN_AJARAN_STORAGE_KEY,
  type TahunAjaranItem,
} from '../../lib/tahunAjaranStore';

interface Pelajaran {
  id: number;
  nama: string;
  tahunAjaran: string;
  guruPengampu: string;
  kelas: string;
  kelompok: 'Ikhwan' | 'Akhwat';
}

const initialPelajaran: Pelajaran[] = [
  { id: 1, nama: 'Matematika', tahunAjaran: '2025/2026 Genap', guruPengampu: 'Ustadz Ahmad Fauzi', kelas: 'X-A', kelompok: 'Ikhwan' },
  { id: 2, nama: 'Bahasa Arab', tahunAjaran: '2025/2026 Genap', guruPengampu: 'Ustadzah Siti Nurhaliza', kelas: 'XI-B', kelompok: 'Akhwat' },
  { id: 3, nama: 'Tahsin & Tahfidz', tahunAjaran: '2026/2027 Ganjil', guruPengampu: 'Ustadz Rahman', kelas: 'XII-A', kelompok: 'Ikhwan' },
];

export default function DataPelajaranPage() {
  const [pelajaran, setPelajaran] = useState<Pelajaran[]>(initialPelajaran);
  const [masterPelajaran, setMasterPelajaran] = useState<MasterPelajaran[]>(
    defaultMasterPelajaran
  );
  const [guruMapelOptions, setGuruMapelOptions] = useState<GuruItem[]>(
    defaultGuruData.filter((item) => item.role.includes('Guru Mapel'))
  );
  const [kelasOptions, setKelasOptions] = useState<KelasItem[]>(defaultKelasData);
  const [filterTahunAjaran, setFilterTahunAjaran] = useState('all');
  const [tahunAjaranOptions, setTahunAjaranOptions] = useState<TahunAjaranItem[]>(
    defaultTahunAjaranData
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPelajaran, setEditingPelajaran] = useState<Pelajaran | null>(null);
  const { toasts, showToast, removeToast } = useToast();

  const [formData, setFormData] = useState({
    nama: defaultMasterPelajaran[0]?.nama ?? '',
    tahunAjaran: '2025/2026 Genap',
    guruPengampu: defaultGuruData.find((item) => item.role.includes('Guru Mapel'))?.nama ?? '',
    kelas: defaultKelasData[0]?.nama ?? '',
    kelompok: 'Ikhwan' as 'Ikhwan' | 'Akhwat',
  });

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
        setMasterPelajaran(parsedData);
      }
    } catch {
      window.localStorage.setItem(
        MASTER_PELAJARAN_STORAGE_KEY,
        JSON.stringify(defaultMasterPelajaran)
      );
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

  const tahunAjaranList = ['all', ...tahunAjaranOptions.map((item) => `${item.nama} ${item.semester}`)];

  useEffect(() => {
    const storedGuru = window.localStorage.getItem(GURU_STORAGE_KEY);
    if (!storedGuru) {
      window.localStorage.setItem(GURU_STORAGE_KEY, JSON.stringify(defaultGuruData));
      setGuruMapelOptions(defaultGuruData.filter((item) => item.role.includes('Guru Mapel')));
      return;
    }

    try {
      const parsedGuru = JSON.parse(storedGuru) as GuruItem[];
      if (Array.isArray(parsedGuru) && parsedGuru.length > 0) {
        setGuruMapelOptions(parsedGuru.filter((item) => item.role.includes('Guru Mapel')));
      }
    } catch {
      window.localStorage.setItem(GURU_STORAGE_KEY, JSON.stringify(defaultGuruData));
      setGuruMapelOptions(defaultGuruData.filter((item) => item.role.includes('Guru Mapel')));
    }
  }, []);

  useEffect(() => {
    const storedKelas = window.localStorage.getItem(KELAS_STORAGE_KEY);
    if (!storedKelas) {
      window.localStorage.setItem(KELAS_STORAGE_KEY, JSON.stringify(defaultKelasData));
      setKelasOptions(defaultKelasData);
      return;
    }

    try {
      const parsedKelas = JSON.parse(storedKelas) as KelasItem[];
      if (Array.isArray(parsedKelas) && parsedKelas.length > 0) {
        setKelasOptions(parsedKelas);
      }
    } catch {
      window.localStorage.setItem(KELAS_STORAGE_KEY, JSON.stringify(defaultKelasData));
      setKelasOptions(defaultKelasData);
    }
  }, []);

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
      tahunAjaran: tahunAjaranList[1] ?? '2025/2026 Genap',
      guruPengampu:
        guruMapelOptions[0]?.nama ??
        defaultGuruData.find((item) => item.role.includes('Guru Mapel'))?.nama ??
        '',
      kelas: kelasOptions[0]?.nama ?? defaultKelasData[0]?.nama ?? '',
      kelompok: 'Ikhwan',
    });
    setShowModal(true);
  };

  const handleEdit = (item: Pelajaran) => {
    setEditingPelajaran(item);
    setFormData({
      nama: item.nama,
      tahunAjaran: item.tahunAjaran,
      guruPengampu: item.guruPengampu,
      kelas: item.kelas,
      kelompok: item.kelompok,
    });
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus data pembelajaran ini?')) {
      setPelajaran(pelajaran.filter((item) => item.id !== id));
      showToast('Data pembelajaran berhasil dihapus!', 'success');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPelajaran) {
      setPelajaran(
        pelajaran.map((item) =>
          item.id === editingPelajaran.id ? { ...formData, id: item.id } : item
        )
      );
      showToast('Data pembelajaran berhasil diperbarui!', 'success');
    } else {
      setPelajaran([...pelajaran, { ...formData, id: Date.now() }]);
      showToast('Data pembelajaran berhasil ditambahkan!', 'success');
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
        {filteredByTahunAjaran.length === 0 ? (
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
