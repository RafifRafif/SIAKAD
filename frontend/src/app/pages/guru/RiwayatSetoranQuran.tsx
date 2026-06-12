'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { motion } from 'motion/react';
import { Toast, useToast } from '../../components/dashboard/Toast';
import { apiGet } from '../../lib/apiClient';
import {
  formatDisplayDate,
  monthLabelFromDate,
  type QuranSubmissionItem,
} from '../../lib/academicActivityStore';
import type { StudentItem } from '../../lib/siswaStore';

const ITEMS_PER_PAGE = 10;

export default function RiwayatSetoranQuran() {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [submissions, setSubmissions] = useState<QuranSubmissionItem[]>([]);
  const [selectedSiswa, setSelectedSiswa] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTanggal, setFilterTanggal] = useState('');
  const [filterBulan, setFilterBulan] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    void apiGet<StudentItem[]>('/api/students')
      .then((items) => {
        setStudents(items);
        setSelectedSiswa((current) => current ?? items[0]?.id ?? null);
      })
      .catch(() => showToast('Gagal memuat data siswa dari backend.', 'error'));
  }, []);

  useEffect(() => {
    void apiGet<QuranSubmissionItem[]>('/api/quran-submissions')
      .then(setSubmissions)
      .catch(() => showToast('Gagal memuat riwayat setoran Qur\'an dari backend.', 'error'));
  }, []);

  const submissionCountByNis = useMemo(
    () =>
      submissions.reduce<Record<string, number>>((accumulator, item) => {
        accumulator[item.nis] = (accumulator[item.nis] ?? 0) + 1;
        return accumulator;
      }, {}),
    [submissions]
  );

  const filteredStudents = students.filter(
    (student) =>
      student.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.nis.includes(searchQuery)
  );
  const selectedStudent = students.find((student) => student.id === selectedSiswa);
  const selectedStudentHistory = useMemo(
    () =>
      selectedStudent
        ? submissions
            .filter((item) => item.nis === selectedStudent.nis)
            .sort((first, second) => {
              const firstDate = first.tanggal ? new Date(first.tanggal).getTime() : 0;
              const secondDate = second.tanggal ? new Date(second.tanggal).getTime() : 0;

              return secondDate - firstDate || second.id - first.id;
            })
        : [],
    [selectedStudent, submissions]
  );
  const monthOptions = useMemo(
    () =>
      Array.from(
        new Set(
          selectedStudentHistory
            .map((item) => monthLabelFromDate(item.tanggal))
            .filter(Boolean)
        )
      ),
    [selectedStudentHistory]
  );
  const filteredHistory = useMemo(
    () =>
      selectedStudentHistory.filter((item) => {
        if (filterBulan === '') {
          return false;
        }

        const matchesTanggal = filterTanggal === '' || item.tanggal === filterTanggal;
        const matchesBulan = monthLabelFromDate(item.tanggal) === filterBulan;

        return matchesTanggal && matchesBulan;
      }),
    [filterBulan, filterTanggal, selectedStudentHistory]
  );
  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedHistory = filteredHistory.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterBulan, filterTanggal, selectedSiswa]);

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

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Riwayat Setoran Al-Qur&apos;an</h2>
        <p className="mt-1 text-gray-600">Lihat riwayat setoran siswa berdasarkan data backend</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-1">
          <h3 className="font-semibold text-gray-900">Daftar Siswa</h3>
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Cari nama atau NIS..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
          </div>

          <div className="max-h-[620px] space-y-4 overflow-y-auto pr-2">
            {filteredStudents.map((student) => (
              <motion.div
                key={student.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setSelectedSiswa(student.id)}
                className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                  selectedSiswa === student.id
                    ? 'border-[#2563EB] bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <p className="mb-2 font-semibold text-gray-900">{student.nama}</p>
                <p className="mb-3 text-xs text-gray-600">NIS: {student.nis}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{student.kelas}</span>
                  <span className="font-medium text-[#2563EB]">
                    {submissionCountByNis[student.nis] ?? 0} setoran
                  </span>
                </div>
              </motion.div>
            ))}
            {filteredStudents.length === 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
                Siswa tidak ditemukan.
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {selectedStudent?.nama ?? 'Pilih siswa'}
                </h3>
                <p className="text-sm text-gray-600">
                  {selectedStudent && filterBulan
                    ? `${selectedStudent.kelas} - ${filteredHistory.length} setoran`
                    : selectedStudent
                    ? `${selectedStudent.kelas} - pilih bulan untuk melihat riwayat`
                    : 'Riwayat setoran akan tampil setelah siswa dipilih'}
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="date"
                  value={filterTanggal}
                  onChange={(event) => setFilterTanggal(event.target.value)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
                <select
                  value={filterBulan}
                  onChange={(event) => setFilterBulan(event.target.value)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#2563EB]"
                >
                  <option value="" disabled>
                    Pilih Bulan
                  </option>
                  {monthOptions.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredHistory.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-600">
                {filterBulan
                  ? 'Belum ada riwayat setoran yang cocok dengan filter.'
                  : 'Pilih bulan untuk melihat riwayat setoran.'}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full">
                    <thead className="border-b border-gray-200 bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                          Tanggal
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                          Surah
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                          Ayat
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                          Penilaian
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                          Keterangan
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paginatedHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {formatDisplayDate(item.tanggal)}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {item.surah}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {item.ayatMulai}-{item.ayatSelesai}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`rounded-full px-3 py-1 font-medium ${penilaianClassName(item.penilaian)}`}>
                              {item.penilaian}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {item.keterangan || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredHistory.length > ITEMS_PER_PAGE && (
                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-gray-600">
                      Menampilkan {startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, filteredHistory.length)} dari {filteredHistory.length} setoran
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                        disabled={currentPage === 1}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-[#2563EB]">
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                        disabled={currentPage === totalPages}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const penilaianClassName = (value: string) => {
  if (value === 'Lancar') {
    return 'bg-green-100 text-green-700';
  }

  if (value === 'Kurang Lancar') {
    return 'bg-yellow-100 text-yellow-700';
  }

  return 'bg-red-100 text-red-700';
};
