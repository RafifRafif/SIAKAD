'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Edit, Trash2, X, Upload, Download, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { DeleteConfirmationDialog } from '../../components/dashboard/DeleteConfirmationDialog';
import { EmptyState } from '../../components/dashboard/EmptyState';
import { PaginationControls } from '../../components/dashboard/PaginationControls';
import { useToast, Toast } from '../../components/dashboard/Toast';
import { ApiError, apiDelete, apiGet, apiPost, apiPut, apiUpload } from '../../lib/apiClient';
import { defaultGuruData, type GuruItem as Guru } from '../../lib/guruStore';
import {
  defaultTahunAjaranData,
  tahunAjaranOptionLabel,
  tahunAjaranOptionValue,
  type TahunAjaranItem,
} from '../../lib/tahunAjaranStore';

const roleOptions: Array<'Wali Kelas' | 'Guru Mapel'> = ['Wali Kelas', 'Guru Mapel'];

export default function DataGuruPage() {
  const [guru, setGuru] = useState<Guru[]>(defaultGuruData);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTahunAjaran, setFilterTahunAjaran] = useState('');
  const [tahunAjaranOptions, setTahunAjaranOptions] = useState<TahunAjaranItem[]>(
    defaultTahunAjaranData
  );
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingGuru, setEditingGuru] = useState<Guru | null>(null);
  const [detailGuru, setDetailGuru] = useState<Guru | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { toasts, showToast, removeToast } = useToast();

  const [formData, setFormData] = useState({
    nip: '',
    nuptk: '',
    nik: '',
    nama: '',
    tahunAjaran: '',
    role: ['Guru Mapel'] as ('Wali Kelas' | 'Guru Mapel')[],
    tempatLahir: '',
    tanggalLahir: '',
    jabatan: '',
    alamat: '',
    sapaan: '' as '' | 'Ustad' | 'Ustadzah',
    email: '',
    telepon: '',
    status: 'Aktif' as 'Aktif' | 'Cuti',
  });

  useEffect(() => {
    void apiGet<Guru[]>('/api/teachers')
      .then(setGuru)
      .catch(() => showToast('Gagal memuat data guru dari backend.', 'error'));
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

  const filteredGuru = guru.filter((g) => {
    const lowerQuery = searchQuery.toLowerCase();
    const matchesSearch =
      g.nama.toLowerCase().includes(lowerQuery) ||
      g.nip.includes(searchQuery) ||
      (g.nuptk ?? '').includes(searchQuery) ||
      (g.nik ?? '').includes(searchQuery) ||
      (g.jabatan ?? '').toLowerCase().includes(lowerQuery) ||
      (g.sapaan ?? '').toLowerCase().includes(lowerQuery) ||
      g.role.some((role) => role.toLowerCase().includes(lowerQuery));
    const matchesTahunAjaran =
      filterTahunAjaran !== '' && g.tahunAjaran === filterTahunAjaran;
    return matchesSearch && matchesTahunAjaran;
  });
  const totalPages = Math.ceil(filteredGuru.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedGuru = filteredGuru.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterTahunAjaran, searchQuery]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleAdd = () => {
    setEditingGuru(null);
    setFormData({
      nip: '',
      nuptk: '',
      nik: '',
      nama: '',
      tahunAjaran: '',
      role: ['Guru Mapel'],
      tempatLahir: '',
      tanggalLahir: '',
      jabatan: '',
      alamat: '',
      sapaan: '',
      email: '',
      telepon: '',
      status: 'Aktif',
    });
    setShowModal(true);
  };

  const handleImport = () => {
    setImportFile(null);
    setShowImportModal(true);
  };

  const handleDownloadTemplate = () => {
    const rows = [
      {
        nip: '1234567890',
        nuptk: '1122334455667788',
        nik: '2171010101010001',
        nama: 'Ahmad Fauzi',
        tahunAjaran: '2026/2027 Ganjil',
        role: 'Guru Mapel',
        tempatLahir: 'Batam',
        tanggalLahir: '1990-01-10',
        jabatan: 'Guru IPA',
        alamat: 'Jl. Ahmad Yani No. 1',
        sapaan: 'Ustad',
        email: 'ahmad.guru@example.com',
        telepon: '081234567890',
        status: 'Aktif',
      },
      {
        nip: '1234567891',
        nuptk: '2233445566778899',
        nik: '2171010202020002',
        nama: 'Siti Aminah',
        tahunAjaran: '2026/2027 Ganjil',
        role: 'Guru Mapel, Wali Kelas',
        tempatLahir: 'Tanjung Pinang',
        tanggalLahir: '1992-02-20',
        jabatan: 'Wali Kelas X-1',
        alamat: 'Jl. Engku Putri No. 2',
        sapaan: 'Ustadzah',
        email: 'siti.guru@example.com',
        telepon: '081234567891',
        status: 'Aktif',
      },
    ];
    const worksheet = XLSX.utils.json_to_sheet(rows, {
      header: ['nip', 'nuptk', 'nik', 'nama', 'tahunAjaran', 'role', 'tempatLahir', 'tanggalLahir', 'jabatan', 'alamat', 'sapaan', 'email', 'telepon', 'status'],
    });
    const workbook = XLSX.utils.book_new();

    worksheet['!cols'] = [
      { wch: 14 },
      { wch: 18 },
      { wch: 20 },
      { wch: 24 },
      { wch: 18 },
      { wch: 24 },
      { wch: 18 },
      { wch: 14 },
      { wch: 20 },
      { wch: 28 },
      { wch: 14 },
      { wch: 28 },
      { wch: 16 },
      { wch: 12 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Guru');
    XLSX.writeFile(workbook, 'template-import-guru.xlsx');
  };

  const handleImportSubmit = async () => {
    if (!importFile) {
      showToast('Silakan pilih file import guru terlebih dahulu!', 'error');
      return;
    }

    try {
      const body = new FormData();
      body.append('file', importFile);

      const response = await apiUpload<{
        imported: number;
        skipped: Array<{ row: number; message: string }>;
        teachers: Guru[];
      }>('/api/teachers/import', body);

      setGuru(response.teachers);
      showToast(
        `Import selesai: ${response.imported} guru diproses, ${response.skipped.length} baris dilewati.`,
        'success'
      );
      setShowImportModal(false);
    } catch {
      showToast('Gagal mengimport data guru.', 'error');
    }
  };

  const handleEdit = (g: Guru) => {
    setEditingGuru(g);
    setFormData({
      nip: g.nip,
      nuptk: g.nuptk ?? '',
      nik: g.nik ?? '',
      nama: g.nama,
      tahunAjaran: g.tahunAjaran,
      role: g.role,
      tempatLahir: g.tempatLahir ?? '',
      tanggalLahir: g.tanggalLahir ?? '',
      jabatan: g.jabatan ?? '',
      alamat: g.alamat ?? '',
      sapaan: (g.sapaan ?? '') as '' | 'Ustad' | 'Ustadzah',
      email: g.email ?? '',
      telepon: g.telepon ?? '',
      status: g.status,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await apiDelete(`/api/teachers/${id}`);
      setGuru((current) => current.filter((g) => g.id !== id));
      showToast('Data guru berhasil dihapus!', 'success');
    } catch {
      showToast('Gagal menghapus data guru.', 'error');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSaving) {
      return;
    }

    if (!formData.nip.trim() || !formData.nama.trim() || !formData.tahunAjaran || formData.role.length === 0) {
      showToast('NIP, nama, tahun ajaran, dan akses guru wajib diisi.', 'error');
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        ...formData,
        nip: formData.nip.trim(),
        nuptk: formData.nuptk.trim(),
        nik: formData.nik.trim(),
        nama: formData.nama.trim(),
        tahunAjaran: formData.tahunAjaran.trim(),
        tempatLahir: formData.tempatLahir.trim(),
        tanggalLahir: formData.tanggalLahir,
        jabatan: formData.jabatan.trim(),
        alamat: formData.alamat.trim(),
        sapaan: formData.sapaan,
        email: formData.email.trim(),
        telepon: formData.telepon.trim(),
      };

      if (editingGuru) {
        const updatedGuru = await apiPut<Guru>(`/api/teachers/${editingGuru.id}`, payload);
        setGuru((current) => upsertGuru(current, updatedGuru));
        showToast('Data guru berhasil diupdate!', 'success');
      } else {
        const newGuru = await apiPost<Guru>('/api/teachers', payload);
        setGuru((current) => upsertGuru(current, newGuru));
        showToast('Guru baru berhasil ditambahkan!', 'success');
      }
      setShowModal(false);
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Gagal menyimpan data guru.'), 'error');
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
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={handleImport}
            className="flex items-center justify-center gap-2 rounded-lg border border-green-500 bg-green-500 px-6 py-3 font-medium text-white shadow-sm transition-all hover:bg-green-600"
          >
            <Upload size={20} />
            <span>Import Data Guru</span>
          </button>
          <button
            onClick={handleAdd}
            className="flex items-center justify-center gap-2 bg-[#2563EB] text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all font-medium shadow-md"
          >
            <Plus size={20} />
            <span>Tambah Guru</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Cari Guru
            </label>
            <div className="relative">
              <Search
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Cari guru (nama, NIP, NUPTK, atau akses)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Filter Tahun Ajaran
            </label>
            <select
              value={filterTahunAjaran}
              onChange={(e) => setFilterTahunAjaran(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none"
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
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredGuru.length === 0 ? (
          <EmptyState
            message={filterTahunAjaran ? 'Tidak ada data guru' : 'Pilih tahun ajaran'}
            description={
              filterTahunAjaran
                ? 'Silakan tambahkan guru baru'
                : 'Data guru akan tampil setelah tahun ajaran dipilih'
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      NIP
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                      Profil Guru
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
                  {paginatedGuru.map((g) => (
                    <motion.tr
                      key={g.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{g.nip}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div>NUPTK: {g.nuptk || '-'}</div>
                        <div>NIK: {g.nik || '-'}</div>
                        <div className="text-xs text-gray-500">
                          {g.tempatLahir || '-'}{g.tanggalLahir ? `, ${g.tanggalLahir}` : ''}
                        </div>
                      </td>
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
                        <div>{g.sapaan || '-'}{g.jabatan ? ` - ${g.jabatan}` : ''}</div>
                        <div>{g.email}</div>
                        <div className="text-xs text-gray-500">{g.telepon}</div>
                        <div className="text-xs text-gray-500">{g.alamat || '-'}</div>
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
                            onClick={() => setDetailGuru(g)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Lihat Detail"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleEdit(g)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit size={18} />
                          </button>
                          <DeleteConfirmationDialog
                            title="Hapus Data Guru?"
                            description="Data guru akan dihapus dari aplikasi dan database. Tindakan ini tidak bisa dibatalkan."
                            itemName={`${g.nama} (${g.nip})`}
                            onConfirm={() => handleDelete(g.id)}
                          >
                            <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
              totalItems={filteredGuru.length}
              itemsPerPage={itemsPerPage}
              itemLabel="guru"
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>

      <AnimatePresence>
        {detailGuru && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setDetailGuru(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl rounded-xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h3 className="text-xl font-bold text-gray-900">Detail Guru</h3>
                <button
                  onClick={() => setDetailGuru(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid gap-4 p-6 md:grid-cols-2">
                <DetailItem label="NIP" value={detailGuru.nip} />
                <DetailItem label="NUPTK" value={detailGuru.nuptk} />
                <DetailItem label="NIK" value={detailGuru.nik} />
                <DetailItem label="Nama Lengkap" value={detailGuru.nama} />
                <DetailItem label="Tahun Ajaran" value={detailGuru.tahunAjaran} />
                <DetailItem label="Akses Guru" value={detailGuru.role.join(', ')} />
                <DetailItem label="Ustad / Ustadzah" value={detailGuru.sapaan} />
                <DetailItem label="Status" value={detailGuru.status} />
                <DetailItem label="Tempat Lahir" value={detailGuru.tempatLahir} />
                <DetailItem label="Tanggal Lahir" value={detailGuru.tanggalLahir} />
                <DetailItem label="Jabatan" value={detailGuru.jabatan} />
                <DetailItem label="Email" value={detailGuru.email} />
                <DetailItem label="Telepon" value={detailGuru.telepon} />
                <DetailItem label="Alamat" value={detailGuru.alamat} wide />
              </div>
            </motion.div>
          </motion.div>
        )}

        {showImportModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowImportModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl rounded-xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h3 className="text-xl font-bold text-gray-900">Import Data Guru</h3>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-5 p-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    File Excel
                  </label>
                  <input
                    type="file"
                    accept=".xlsx,.csv"
                    onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-medium file:text-[#2563EB] hover:file:bg-blue-100"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Format yang didukung: `.xlsx` atau `.csv`
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-[#2563EB] transition-all hover:bg-blue-100"
                >
                  <Download size={18} />
                  <span>Unduh Template Excel</span>
                </button>

                <div className="flex gap-4 border-t border-gray-200 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="flex-1 rounded-lg border-2 border-gray-300 px-6 py-3 font-medium text-gray-700 transition-all hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleImportSubmit}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-6 py-3 font-medium text-white transition-all hover:bg-blue-700"
                  >
                    <Upload size={18} />
                    <span>Import File</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

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
              className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
            >
              <div className="border-b px-6 py-4 flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  {editingGuru ? 'Edit Guru' : 'Tambah Guru Baru'}
                </h3>
                <button onClick={() => setShowModal(false)}>
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
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
                      placeholder="Masukkan NIP guru"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] outline-none"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Nomor Induk Pegawai.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      NUPTK
                    </label>
                    <input
                      type="text"
                      value={formData.nuptk}
                      onChange={(e) => setFormData({ ...formData, nuptk: e.target.value.replace(/\D/g, '') })}
                      placeholder="Masukkan NUPTK"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] outline-none"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Nomor Unik Pendidik dan Tenaga Kependidikan.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      NIK
                    </label>
                    <input
                      type="text"
                      value={formData.nik}
                      onChange={(e) => setFormData({ ...formData, nik: e.target.value.replace(/\D/g, '') })}
                      placeholder="Masukkan NIK"
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
                      Ustad / Ustadzah
                    </label>
                    <select
                      value={formData.sapaan}
                      onChange={(e) =>
                        setFormData({ ...formData, sapaan: e.target.value as '' | 'Ustad' | 'Ustadzah' })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] outline-none"
                    >
                      <option value="">Pilih Sapaan</option>
                      <option value="Ustad">Ustad</option>
                      <option value="Ustadzah">Ustadzah</option>
                    </select>
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
                      Tempat Lahir
                    </label>
                    <input
                      type="text"
                      value={formData.tempatLahir}
                      onChange={(e) => setFormData({ ...formData, tempatLahir: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tanggal Lahir
                    </label>
                    <input
                      type="date"
                      value={formData.tanggalLahir}
                      onChange={(e) => setFormData({ ...formData, tanggalLahir: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Jabatan
                    </label>
                    <input
                      type="text"
                      value={formData.jabatan}
                      onChange={(e) => setFormData({ ...formData, jabatan: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] outline-none"
                    />
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alamat
                  </label>
                  <textarea
                    value={formData.alamat}
                    onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] outline-none"
                  />
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

const upsertGuru = (items: Guru[], nextItem: Guru) =>
  items.some((item) => item.id === nextItem.id)
    ? items.map((item) => (item.id === nextItem.id ? nextItem : item))
    : [...items, nextItem];

function DetailItem({
  label,
  value,
  wide = false,
}: {
  label: string;
  value?: string | null;
  wide?: boolean;
}) {
  return (
    <div className={wide ? 'md:col-span-2' : ''}>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900">
        {value && value.trim() !== '' ? value : '-'}
      </p>
    </div>
  );
}

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
