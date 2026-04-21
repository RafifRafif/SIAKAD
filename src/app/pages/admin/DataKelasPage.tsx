'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Edit, Trash2, X, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EmptyState } from '../../components/dashboard/EmptyState';
import { Toast, useToast } from '../../components/dashboard/Toast';
import { defaultKelasData, KELAS_STORAGE_KEY, type KelasItem as Kelas } from '../../lib/kelasStore';
import { defaultGuruData, GURU_STORAGE_KEY, type GuruItem } from '../../lib/guruStore';
import { defaultSiswaData, SISWA_STORAGE_KEY, type StudentItem } from '../../lib/siswaStore';
import {
  defaultTahunAjaranData,
  TAHUN_AJARAN_STORAGE_KEY,
  type TahunAjaranItem,
} from '../../lib/tahunAjaranStore';

export default function DataKelasPage() {
  const [kelas, setKelas] = useState<Kelas[]>(defaultKelasData);
  const [waliKelasOptions, setWaliKelasOptions] = useState<GuruItem[]>(
    defaultGuruData.filter((item) => item.role.includes('Wali Kelas'))
  );
  const [students, setStudents] = useState<StudentItem[]>(defaultSiswaData);
  const [filterTahunAjaran, setFilterTahunAjaran] = useState('all');
  const [tahunAjaranOptions, setTahunAjaranOptions] = useState<TahunAjaranItem[]>(
    defaultTahunAjaranData
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingKelas, setEditingKelas] = useState<Kelas | null>(null);
  const { toasts, showToast, removeToast } = useToast();

  const [formData, setFormData] = useState({
    nama: '',
    tahunAjaran: '2025/2026 Genap',
    kelompok: 'Ikhwan' as 'Ikhwan' | 'Akhwat',
    waliKelas:
      defaultGuruData.find((item) => item.role.includes('Wali Kelas'))?.nama ?? '',
    jumlahSiswa: 0,
  });

  useEffect(() => {
    const storedData = window.localStorage.getItem(KELAS_STORAGE_KEY);
    if (!storedData) {
      window.localStorage.setItem(KELAS_STORAGE_KEY, JSON.stringify(defaultKelasData));
      return;
    }

    try {
      const parsedData = JSON.parse(storedData) as Kelas[];
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        setKelas(parsedData);
      }
    } catch {
      window.localStorage.setItem(KELAS_STORAGE_KEY, JSON.stringify(defaultKelasData));
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

  useEffect(() => {
    const storedGuru = window.localStorage.getItem(GURU_STORAGE_KEY);
    if (!storedGuru) {
      window.localStorage.setItem(GURU_STORAGE_KEY, JSON.stringify(defaultGuruData));
      setWaliKelasOptions(defaultGuruData.filter((item) => item.role.includes('Wali Kelas')));
      return;
    }

    try {
      const parsedGuru = JSON.parse(storedGuru) as GuruItem[];
      if (Array.isArray(parsedGuru)) {
        setWaliKelasOptions(parsedGuru.filter((item) => item.role.includes('Wali Kelas')));
      }
    } catch {
      window.localStorage.setItem(GURU_STORAGE_KEY, JSON.stringify(defaultGuruData));
      setWaliKelasOptions(defaultGuruData.filter((item) => item.role.includes('Wali Kelas')));
    }
  }, []);

  useEffect(() => {
    const storedSiswa = window.localStorage.getItem(SISWA_STORAGE_KEY);
    if (!storedSiswa) {
      window.localStorage.setItem(SISWA_STORAGE_KEY, JSON.stringify(defaultSiswaData));
      return;
    }

    try {
      const parsedSiswa = JSON.parse(storedSiswa) as StudentItem[];
      if (Array.isArray(parsedSiswa)) {
        setStudents(parsedSiswa);
      }
    } catch {
      window.localStorage.setItem(SISWA_STORAGE_KEY, JSON.stringify(defaultSiswaData));
    }
  }, []);

  const syncKelas = (nextKelas: Kelas[]) => {
    setKelas(nextKelas);
    window.localStorage.setItem(KELAS_STORAGE_KEY, JSON.stringify(nextKelas));
  };

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
      nama: '',
      tahunAjaran: tahunAjaranList[1] ?? '2025/2026 Genap',
      kelompok: 'Ikhwan',
      waliKelas:
        waliKelasOptions[0]?.nama ??
        defaultGuruData.find((item) => item.role.includes('Wali Kelas'))?.nama ??
        '',
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

  const handleDelete = (id: number) => {
    if (confirm('Apakah Anda yakin ingin menghapus data kelas ini?')) {
      syncKelas(kelas.filter((item) => item.id !== id));
      showToast('Data kelas berhasil dihapus!', 'success');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingKelas) {
      syncKelas(
        kelas.map((item) =>
          item.id === editingKelas.id ? { ...formData, id: item.id } : item
        )
      );
      showToast('Data kelas berhasil diperbarui!', 'success');
    } else {
      syncKelas([...kelas, { ...formData, id: Date.now() }]);
      showToast('Data kelas berhasil ditambahkan!', 'success');
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
        {filteredKelas.length === 0 ? (
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
