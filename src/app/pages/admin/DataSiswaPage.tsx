'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Edit, Trash2, X, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { EmptyState } from '../../components/dashboard/EmptyState';
import { useToast, Toast } from '../../components/dashboard/Toast';
import { apiRequest } from '../../lib/api';
import { type StudentItem as Student, type TahunAjaranItem } from '../../lib/masterDataTypes';

interface BackendAcademicYear {
  id: number;
  name: string;
  semester: 'Ganjil' | 'Genap';
  is_active: boolean;
}

interface BackendClass {
  id: number;
  name: string;
  level: 'X' | 'XI' | 'XII';
}

interface BackendStudent {
  id: number;
  nis: string;
  name: string;
  gender: string;
  email: string | null;
  phone: string | null;
  academic_year_id: number | null;
  class_id: number | null;
  academic_year?: BackendAcademicYear | null;
  class?: BackendClass | null;
}

const defaultFormData = {
  nis: '',
  nama: '',
  tahunAjaran: '',
  kelas: '',
  jenisKelamin: 'Laki-laki',
  email: '',
  telepon: '',
};

const mapAcademicYearToOption = (item: BackendAcademicYear): TahunAjaranItem => ({
  id: item.id,
  nama: item.name,
  semester: item.semester,
  tanggalMulai: '',
  tanggalSelesai: '',
  status: item.is_active ? 'Aktif' : 'Draft',
});

const mapStudentToViewModel = (student: BackendStudent): Student => ({
  id: student.id,
  nis: student.nis,
  nama: student.name,
  tahunAjaran: student.academic_year
    ? `${student.academic_year.name} ${student.academic_year.semester}`
    : '',
  kelas: student.class?.name ?? '',
  jenisKelamin: student.gender,
  email: student.email ?? '',
  telepon: student.phone ?? '',
});

export default function DataSiswaPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classOptions, setClassOptions] = useState<BackendClass[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKelas, setFilterKelas] = useState('all');
  const [filterTahunAjaran, setFilterTahunAjaran] = useState('all');
  const [tahunAjaranOptions, setTahunAjaranOptions] = useState<TahunAjaranItem[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const itemsPerPage = 5;
  const { toasts, showToast, removeToast } = useToast();

  const [formData, setFormData] = useState(defaultFormData);

  const tahunAjaranList = useMemo(
    () => ['all', ...tahunAjaranOptions.map((item) => `${item.nama} ${item.semester}`)],
    [tahunAjaranOptions]
  );

  const kelasList = useMemo(
    () => ['all', ...classOptions.map((schoolClass) => schoolClass.name)],
    [classOptions]
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        const [studentsResponse, academicYearsResponse, classesResponse] = await Promise.all([
          apiRequest<{ data: BackendStudent[] }>('/students'),
          apiRequest<{ data: BackendAcademicYear[] }>('/academic-years'),
          apiRequest<{ data: BackendClass[] }>('/classes'),
        ]);

        setStudents(studentsResponse.data.map(mapStudentToViewModel));
        setTahunAjaranOptions(academicYearsResponse.data.map(mapAcademicYearToOption));
        setClassOptions(classesResponse.data);
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : 'Gagal memuat data siswa dari backend.',
          'error'
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterKelas, filterTahunAjaran]);

  const resolveAcademicYearId = (tahunAjaran: string) =>
    tahunAjaranOptions.find((item) => `${item.nama} ${item.semester}` === tahunAjaran)?.id ?? null;

  const resolveClassId = (kelas: string) =>
    classOptions.find((item) => item.name === kelas)?.id ?? null;

  // Filter students
  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.nis.includes(searchQuery);
    const matchesKelas = filterKelas === 'all' || student.kelas === filterKelas;
    const matchesTahunAjaran =
      filterTahunAjaran === 'all' || student.tahunAjaran === filterTahunAjaran;
    return matchesSearch && matchesKelas && matchesTahunAjaran;
  });

  // Pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);

  const handleAdd = () => {
    setEditingStudent(null);
    setFormData({
      ...defaultFormData,
      tahunAjaran: tahunAjaranList[1] ?? '',
      kelas: kelasList[1] ?? '',
    });
    setShowModal(true);
  };

  const handleImport = () => {
    setImportFile(null);
    setShowImportModal(true);
  };

  const handleImportSubmit = () => {
    if (!importFile) {
      showToast('Silakan pilih file Excel terlebih dahulu!', 'error');
      return;
    }

    showToast(`File ${importFile.name} siap diproses untuk import data siswa.`, 'success');
    setShowImportModal(false);
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData(student);
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus siswa ini?')) {
      return;
    }

    void (async () => {
      try {
        const response = await apiRequest<{ message: string }>(`/students/${id}`, {
          method: 'DELETE',
        });
        setStudents((currentStudents) => currentStudents.filter((student) => student.id !== id));
        showToast(response.message, 'success');
      } catch (error) {
        showToast(
          error instanceof Error ? error.message : 'Gagal menghapus data siswa.',
          'error'
        );
      }
    })();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      nis: formData.nis,
      name: formData.nama,
      academic_year_id: resolveAcademicYearId(formData.tahunAjaran),
      class_id: resolveClassId(formData.kelas),
      gender: formData.jenisKelamin,
      email: formData.email || null,
      phone: formData.telepon || null,
    };

    try {
      if (editingStudent) {
        const response = await apiRequest<{ message: string; data: BackendStudent }>(
          `/students/${editingStudent.id}`,
          {
            method: 'PUT',
            body: payload,
          }
        );

        if (!response?.data) {
          throw new Error('Data siswa dari backend tidak lengkap.');
        }

        setStudents((currentStudents) =>
          currentStudents.map((student) =>
            student.id === editingStudent.id ? mapStudentToViewModel(response.data) : student
          )
        );
        showToast(response.message, 'success');
      } else {
        const response = await apiRequest<{ message: string; data: BackendStudent }>('/students', {
          method: 'POST',
          body: payload,
        });

        if (!response?.data) {
          throw new Error('Data siswa dari backend tidak lengkap.');
        }

        setStudents((currentStudents) => [...currentStudents, mapStudentToViewModel(response.data)]);
        showToast(response.message, 'success');
      }

      setShowModal(false);
    } catch (error) {
      showToast(
        error instanceof Error ? error.message : 'Gagal menyimpan data siswa.',
        'error'
      );
    }
  };

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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Data Siswa</h2>
          <p className="text-gray-600 mt-1">Kelola data siswa sekolah</p>
        </div>
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
            {kelasList.map((kelas) => (
              <option key={kelas} value={kelas}>
                {kelas === 'all' ? 'Semua Kelas' : `Kelas ${kelas}`}
              </option>
            ))}
          </select>

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

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="px-6 py-10 text-center text-sm text-gray-500">
            Memuat data siswa dari backend...
          </div>
        ) : paginatedStudents.length === 0 ? (
          <EmptyState message="Tidak ada data siswa" description="Silakan tambahkan siswa baru" />
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
                            onClick={() => handleEdit(student)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(student.id)}
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
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:font-medium file:text-[#2563EB] hover:file:bg-blue-100"
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Format yang didukung: `.xlsx`, `.xls`, atau `.csv`
                  </p>
                </div>

                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3">
                  <p className="text-sm text-gray-600">
                    {importFile ? `File terpilih: ${importFile.name}` : 'Belum ada file yang dipilih'}
                  </p>
                </div>

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
                        value={formData.nis}
                        onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
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
                        {tahunAjaranList.filter((item) => item !== 'all').map((tahunAjaran) => (
                          <option key={tahunAjaran} value={tahunAjaran}>
                            {tahunAjaran}
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
                        {kelasList.filter((k) => k !== 'all').map((kelas) => (
                          <option key={kelas} value={kelas}>
                            {kelas}
                          </option>
                        ))}
                      </select>
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
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
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
