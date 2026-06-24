'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Edit, Trash2, X, Upload, Eye, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';
import { DeleteConfirmationDialog } from '../../components/dashboard/DeleteConfirmationDialog';
import { EmptyState } from '../../components/dashboard/EmptyState';
import { useToast, Toast } from '../../components/dashboard/Toast';
import { ApiError, apiDelete, apiGet, apiPost, apiPut, apiUpload } from '../../lib/apiClient';
import { defaultGuruData, type GuruItem } from '../../lib/guruStore';
import { type KelasItem } from '../../lib/kelasStore';
import { defaultSiswaData, type StudentItem as Student } from '../../lib/siswaStore';
import {
  defaultTahunAjaranData,
  tahunAjaranOptionLabel,
  tahunAjaranOptionValue,
  type TahunAjaranItem,
} from '../../lib/tahunAjaranStore';

export default function DataSiswaPage() {
  const [students, setStudents] = useState<Student[]>(defaultSiswaData);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterTahunAjaran, setFilterTahunAjaran] = useState('');
  const [tahunAjaranOptions, setTahunAjaranOptions] = useState<TahunAjaranItem[]>(
    defaultTahunAjaranData
  );
  const [guruOptions, setGuruOptions] = useState<GuruItem[]>(defaultGuruData);
  const [kelasOptions, setKelasOptions] = useState<KelasItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const itemsPerPage = 10;
  const { toasts, showToast, removeToast } = useToast();

  const [formData, setFormData] = useState({
    nis: '',
    nisn: '',
    nik: '',
    nama: '',
    tahunAjaran: '',
    kelas: '',
    waliKelas: '',
    asalSekolah: '',
    namaOrangTua: '',
    jenisKelamin: 'Laki-laki',
    tempatLahir: '',
    tanggalLahir: '',
    alamat: '',
    email: '',
    telepon: '',
  });

  useEffect(() => {
    void apiGet<Student[]>('/api/students')
      .then(setStudents)
      .catch(() => showToast('Gagal memuat data siswa dari backend.', 'error'));
  }, []);

  useEffect(() => {
    void apiGet<TahunAjaranItem[]>('/api/academic-years')
      .then(setTahunAjaranOptions)
      .catch(() => showToast('Gagal memuat tahun ajaran dari backend.', 'error'));
  }, []);

  useEffect(() => {
    void apiGet<KelasItem[]>('/api/school-classes')
      .then(setKelasOptions)
      .catch(() => showToast('Gagal memuat data kelas dari backend.', 'error'));
  }, []);

  useEffect(() => {
    void apiGet<GuruItem[]>('/api/teachers')
      .then(setGuruOptions)
      .catch(() => showToast('Gagal memuat data guru dari backend.', 'error'));
  }, []);

  const tahunAjaranList = useMemo(
    () => {
      const options = tahunAjaranOptions.map((item) => ({
        value: tahunAjaranOptionValue(item),
        label: tahunAjaranOptionLabel(item),
      }));
      const knownValues = new Set(options.map((item) => item.value));

      for (const student of students) {
        if (student.tahunAjaran && !knownValues.has(student.tahunAjaran)) {
          options.push({
            value: student.tahunAjaran,
            label: student.tahunAjaran,
          });
          knownValues.add(student.tahunAjaran);
        }
      }

      return options;
    },
    [tahunAjaranOptions, students]
  );

  // Filter students
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.nis.includes(searchQuery);
    const matchesKelas = filterKelas !== '' && student.kelas === filterKelas;
    const matchesTahunAjaran =
      filterTahunAjaran !== '' && student.tahunAjaran === filterTahunAjaran;
    return matchesSearch && matchesKelas && matchesTahunAjaran;
  });

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);

  const handleAdd = () => {
    setEditingStudent(null);
    setFormData({
      nis: '',
      nisn: '',
      nik: '',
      nama: '',
      tahunAjaran: '',
      kelas: '',
      waliKelas: '',
      asalSekolah: '',
      namaOrangTua: '',
      jenisKelamin: '',
      tempatLahir: '',
      tanggalLahir: '',
      alamat: '',
      email: '',
      telepon: '',
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
        nis: '1234567890',
        nisn: '001234567890',
        nik: '2171010101010001',
        nama: 'Ahmad Fauzan',
        tahunAjaran: '2026/2027 Ganjil',
        kelas: 'X-1',
        waliKelas: 'Ustadz Ahmad',
        asalSekolah: 'SMP IT Ulil Albab',
        namaOrangTua: 'Bapak Fauzi',
        jenisKelamin: 'Laki-laki',
        tempatLahir: 'Batam',
        tanggalLahir: '2010-01-15',
        alamat: 'Jl. Diponegoro No. 1',
        email: 'ahmad@example.com',
        telepon: '081234567890',
      },
    ];
    const worksheet = XLSX.utils.json_to_sheet(rows, {
      header: [
        'nis',
        'nisn',
        'nik',
        'nama',
        'tahunAjaran',
        'kelas',
        'waliKelas',
        'asalSekolah',
        'namaOrangTua',
        'jenisKelamin',
        'tempatLahir',
        'tanggalLahir',
        'alamat',
        'email',
        'telepon',
      ],
    });
    const workbook = XLSX.utils.book_new();

    worksheet['!cols'] = [
      { wch: 14 },
      { wch: 16 },
      { wch: 20 },
      { wch: 24 },
      { wch: 18 },
      { wch: 10 },
      { wch: 20 },
      { wch: 20 },
      { wch: 24 },
      { wch: 14 },
      { wch: 16 },
      { wch: 14 },
      { wch: 28 },
      { wch: 24 },
      { wch: 16 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Siswa');
    XLSX.writeFile(workbook, 'template-import-siswa.xlsx');
  };

  const handleImportSubmit = async () => {
    if (!importFile) {
      showToast('Silakan pilih file Excel terlebih dahulu!', 'error');
      return;
    }

    try {
      const body = new FormData();
      body.append('file', importFile);

      const response = await apiUpload<{
        imported: number;
        skipped: Array<{ row: number; message: string }>;
        importedStudents?: Student[];
        students: Student[];
      }>('/api/students/import', body);

      setStudents(response.students);
      const firstImportedStudent = response.importedStudents?.[0] ?? response.students.at(-1);

      if (firstImportedStudent) {
        setSearchQuery('');
        setFilterKelas(firstImportedStudent.kelas);
        setFilterTahunAjaran(firstImportedStudent.tahunAjaran);
        setCurrentPage(1);
      }

      showToast(
        `Import selesai: ${response.imported} siswa diproses, ${response.skipped.length} baris dilewati.`,
        'success'
      );
      setShowImportModal(false);
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Gagal mengimport data siswa.'), 'error');
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      nis: student.nis,
      nisn: student.nisn ?? '',
      nik: student.nik ?? '',
      nama: student.nama,
      tahunAjaran: student.tahunAjaran,
      kelas: student.kelas,
      waliKelas: student.waliKelas ?? '',
      asalSekolah: student.asalSekolah ?? '',
      namaOrangTua: student.namaOrangTua ?? '',
      jenisKelamin: student.jenisKelamin,
      tempatLahir: student.tempatLahir ?? '',
      tanggalLahir: student.tanggalLahir ?? '',
      alamat: student.alamat ?? '',
      email: student.email,
      telepon: student.telepon,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await apiDelete(`/api/students/${id}`);
      setStudents((current) => current.filter((s) => s.id !== id));
      showToast('Siswa berhasil dihapus!', 'success');
    } catch {
      showToast('Gagal menghapus data siswa.', 'error');
    }
  };

  const handleNumericFieldChange = (field: 'nis' | 'nisn' | 'nik', value: string) => {
    setFormData((current) => ({
      ...current,
      [field]: value.replace(/\D/g, ''),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSaving) {
      return;
    }

    if (!formData.tahunAjaran || !formData.kelas || !formData.jenisKelamin) {
      showToast('Tahun ajaran, kelas, dan jenis kelamin wajib dipilih sebelum menyimpan siswa.', 'error');
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        ...formData,
        nis: formData.nis.trim(),
        nisn: formData.nisn.trim(),
        nik: formData.nik.trim(),
        nama: formData.nama.trim(),
        tahunAjaran: formData.tahunAjaran.trim(),
        kelas: formData.kelas.trim(),
        waliKelas: formData.waliKelas.trim(),
        asalSekolah: formData.asalSekolah.trim(),
        namaOrangTua: formData.namaOrangTua.trim(),
        tempatLahir: formData.tempatLahir.trim(),
        tanggalLahir: formData.tanggalLahir,
        alamat: formData.alamat.trim(),
        email: formData.email.trim(),
        telepon: formData.telepon.trim(),
      };

      if (editingStudent) {
        const updatedStudent = await apiPut<Student>(
          `/api/students/${editingStudent.id}`,
          payload
        );
        setStudents((current) => upsertStudent(current, updatedStudent));
        showToast('Data siswa berhasil diupdate!', 'success');
      } else {
        const newStudent = await apiPost<Student>('/api/students', payload);
        setStudents((current) => upsertStudent(current, newStudent));
        showToast('Siswa baru berhasil ditambahkan!', 'success');
      }
      setShowModal(false);
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Gagal menyimpan data siswa.'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const kelasList = useMemo(
    () => [
      ...Array.from(
        new Set([
          ...kelasOptions.map((item) => item.nama),
          ...students.map((student) => student.kelas),
        ].filter(Boolean))
      ),
    ],
    [kelasOptions, students]
  );

  const waliKelasList = useMemo(
    () =>
      guruOptions
        .filter((guru) => guru.status === 'Aktif' && guru.role.includes('Wali Kelas'))
        .filter((guru) => !formData.tahunAjaran || guru.tahunAjaran === formData.tahunAjaran)
        .map((guru) => guru.nama),
    [formData.tahunAjaran, guruOptions]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filterKelas, filterTahunAjaran, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
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
            <span>Import Data Siswa</span>
          </button>
          <button
            onClick={handleAdd}
            className="flex items-center justify-center gap-2 bg-[#2563EB] text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all font-medium shadow-md hover:shadow-lg"
          >
            <Plus size={20} />
            <span>Tambah Siswa</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="grid md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search
              size={20}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Cari siswa (nama atau NIS)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none"
            />
          </div>

          {/* Filter Kelas */}
          <select
            value={filterKelas}
            onChange={(e) => setFilterKelas(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none"
          >
            <option value="" disabled>
              Pilih Kelas
            </option>
            {kelasList.map((kelas) => (
              <option key={kelas} value={kelas}>
                {kelas}
              </option>
            ))}
          </select>

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

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {paginatedStudents.length === 0 ? (
          <EmptyState
            message={
              filterKelas && filterTahunAjaran
                ? 'Tidak ada data siswa'
                : 'Pilih kelas dan tahun ajaran'
            }
            description={
              filterKelas && filterTahunAjaran
                ? 'Silakan tambahkan siswa baru'
                : 'Data siswa akan tampil setelah kelas dan tahun ajaran dipilih'
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      NIS
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      NISN
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Nama
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Kelas
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Jenis Kelamin
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Kontak
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedStudents.map((student) => (
                    <motion.tr
                      key={student.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {student.nis}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {student.nisn || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{student.nama}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-3 py-1 bg-blue-100 text-[#2563EB] rounded-full font-medium">
                          {student.kelas}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {student.jenisKelamin}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div>{student.email}</div>
                        <div className="text-xs text-gray-500">{student.telepon}</div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setDetailStudent(student)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Lihat Detail"
                          >
                            <Eye size={18} />
                          </button>
                          <button
                            onClick={() => handleEdit(student)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit size={18} />
                          </button>
                          <DeleteConfirmationDialog
                            title="Hapus Data Siswa?"
                            description="Data siswa akan dihapus dari aplikasi dan database. Tindakan ini tidak bisa dibatalkan."
                            itemName={`${student.nama} (${student.nis})`}
                            onConfirm={() => handleDelete(student.id)}
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Menampilkan {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredStudents.length)} dari{' '}
                  {filteredStudents.length} siswa
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-lg ${
                        currentPage === page
                          ? 'bg-[#2563EB] text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {detailStudent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setDetailStudent(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h3 className="text-xl font-bold text-gray-900">Detail Siswa</h3>
                <button
                  onClick={() => setDetailStudent(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="grid flex-1 gap-4 overflow-y-auto p-6 md:grid-cols-2">
                <DetailItem label="NIS" value={detailStudent.nis} />
                <DetailItem label="NISN" value={detailStudent.nisn} />
                <DetailItem label="NIK" value={detailStudent.nik} />
                <DetailItem label="Nama Lengkap" value={detailStudent.nama} />
                <DetailItem label="Tahun Ajaran" value={detailStudent.tahunAjaran} />
                <DetailItem label="Kelas" value={detailStudent.kelas} />
                <DetailItem label="Wali Kelas" value={detailStudent.waliKelas} />
                <DetailItem label="Asal Sekolah" value={detailStudent.asalSekolah} />
                <DetailItem label="Nama Orang Tua" value={detailStudent.namaOrangTua} />
                <DetailItem label="Jenis Kelamin" value={detailStudent.jenisKelamin} />
                <DetailItem label="Tempat Lahir" value={detailStudent.tempatLahir} />
                <DetailItem label="Tanggal Lahir" value={detailStudent.tanggalLahir} />
                <DetailItem label="Email" value={detailStudent.email} />
                <DetailItem label="Telepon" value={detailStudent.telepon} />
                <DetailItem label="Alamat" value={detailStudent.alamat} wide />
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
                <h3 className="text-xl font-bold text-gray-900">Import Data Siswa</h3>
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
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setShowModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">
                    {editingStudent ? 'Edit Siswa' : 'Tambah Siswa Baru'}
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        NIS
                      </label>
                      <input
                        type="text"
                        required
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={formData.nis}
                        onChange={(e) => handleNumericFieldChange('nis', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        NISN
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={formData.nisn}
                        onChange={(e) => handleNumericFieldChange('nisn', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        NIK
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={formData.nik}
                        onChange={(e) => handleNumericFieldChange('nik', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tahun Ajaran
                      </label>
                      <select
                        value={formData.tahunAjaran}
                        onChange={(e) =>
                          setFormData({ ...formData, tahunAjaran: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none"
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
                        Kelas
                      </label>
                      <select
                        value={formData.kelas}
                        onChange={(e) => setFormData({ ...formData, kelas: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none"
                      >
                        <option value="" disabled>
                          Pilih kelas
                        </option>
                        {kelasList.map((kelas) => (
                          <option key={kelas} value={kelas}>
                            {kelas}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Wali Kelas
                      </label>
                      <select
                        value={formData.waliKelas}
                        onChange={(e) => setFormData({ ...formData, waliKelas: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none"
                      >
                        <option value="">Pilih wali kelas</option>
                        {waliKelasList.map((guru) => (
                          <option key={guru} value={guru}>
                            {guru}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Asal Sekolah
                      </label>
                      <input
                        type="text"
                        value={formData.asalSekolah}
                        onChange={(e) => setFormData({ ...formData, asalSekolah: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nama Orang Tua
                      </label>
                      <input
                        type="text"
                        value={formData.namaOrangTua}
                        onChange={(e) => setFormData({ ...formData, namaOrangTua: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Jenis Kelamin
                      </label>
                      <select
                        value={formData.jenisKelamin}
                        onChange={(e) =>
                          setFormData({ ...formData, jenisKelamin: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none"
                      >
                        <option value="" disabled>
                          Pilih jenis kelamin
                        </option>
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tempat Lahir
                      </label>
                      <input
                        type="text"
                        value={formData.tempatLahir}
                        onChange={(e) =>
                          setFormData({ ...formData, tempatLahir: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tanggal Lahir
                      </label>
                      <input
                        type="date"
                        value={formData.tanggalLahir}
                        onChange={(e) =>
                          setFormData({ ...formData, tanggalLahir: e.target.value })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Alamat
                      </label>
                      <textarea
                        value={formData.alamat}
                        onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-[#2563EB] text-white rounded-lg hover:bg-blue-700 transition-all font-medium shadow-md hover:shadow-lg"
                    >
                      {editingStudent ? 'Update' : 'Simpan'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

const upsertStudent = (items: Student[], nextItem: Student) => {
  if (items.some((item) => item.id === nextItem.id)) {
    return items.map((item) => (item.id === nextItem.id ? nextItem : item));
  }

  return [...items, nextItem];
};

const DetailItem = ({
  label,
  value,
  wide = false,
}: {
  label: string;
  value?: string | null;
  wide?: boolean;
}) => (
  <div className={wide ? 'md:col-span-2' : undefined}>
    <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
      {label}
    </p>
    <p className="mt-1 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900">
      {value || '-'}
    </p>
  </div>
);

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
