'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { motion } from 'motion/react';
import { useToast, Toast } from '../../components/dashboard/Toast';
import { apiGet, apiPost } from '../../lib/apiClient';
import type { LearningAssignmentItem } from '../../lib/academicActivityStore';
import type { KelasItem } from '../../lib/kelasStore';
import type { MasterPelajaran } from '../../lib/pelajaranStore';
import type { StudentItem } from '../../lib/siswaStore';

type PresensiStatus = 'hadir' | 'alpha' | 'sakit' | 'izin';

const statusOptions: Array<{
  key: PresensiStatus;
  label: string;
  selectedClass: string;
  hoverClass: string;
}> = [
  {
    key: 'hadir',
    label: 'Hadir',
    selectedClass: 'border-green-500 bg-green-50 text-green-700',
    hoverClass: 'hover:border-green-500 hover:text-green-700',
  },
  {
    key: 'alpha',
    label: 'Alpha',
    selectedClass: 'border-red-500 bg-red-50 text-red-700',
    hoverClass: 'hover:border-red-500 hover:text-red-700',
  },
  {
    key: 'sakit',
    label: 'Sakit',
    selectedClass: 'border-amber-500 bg-amber-50 text-amber-700',
    hoverClass: 'hover:border-amber-500 hover:text-amber-700',
  },
  {
    key: 'izin',
    label: 'Izin',
    selectedClass: 'border-blue-500 bg-blue-50 text-blue-700',
    hoverClass: 'hover:border-blue-500 hover:text-blue-700',
  },
];

export default function PresensiGuru() {
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [learningAssignments, setLearningAssignments] = useState<LearningAssignmentItem[]>([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [selectedMapel, setSelectedMapel] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [isSaving, setIsSaving] = useState(false);
  const [presensi, setPresensi] = useState<{ [key: number]: PresensiStatus | null }>({});
  const [keterangan, setKeterangan] = useState<{ [key: number]: string }>({});
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    void apiGet<StudentItem[]>('/api/students')
      .then((items) => {
        setStudents(items);
        setPresensi(Object.fromEntries(items.map((student) => [student.id, null])));
        setKeterangan(Object.fromEntries(items.map((student) => [student.id, ''])));
      })
      .catch(() => showToast('Gagal memuat data siswa dari backend.', 'error'));
  }, []);

  useEffect(() => {
    void apiGet<LearningAssignmentItem[]>('/api/learning-assignments')
      .then(setLearningAssignments)
      .catch(() => showToast('Gagal memuat data pelajaran yang diampu dari backend.', 'error'));
  }, []);

  const kelasOptions = useMemo<KelasItem[]>(
    () =>
      Array.from(
        new Map(
          learningAssignments.map((item) => [
            item.kelas,
            {
              id: item.id,
              nama: item.kelas,
              tahunAjaran: item.tahunAjaran,
              kelompok: item.kelompok,
              waliKelas: '',
              jumlahSiswa: 0,
            },
          ])
        ).values()
      ),
    [learningAssignments]
  );

  const mapelOptions = useMemo<MasterPelajaran[]>(
    () =>
      Array.from(
        new Map(
          learningAssignments
            .filter((item) => !selectedKelas || item.kelas === selectedKelas)
            .map((item) => [
              item.nama,
              {
                id: item.id,
                nama: item.nama,
                tahunAjaran: item.tahunAjaran,
              },
            ])
        ).values()
      ),
    [learningAssignments, selectedKelas]
  );

  useEffect(() => {
    setSelectedKelas((current) =>
      current && kelasOptions.some((kelas) => kelas.nama === current)
        ? current
        : kelasOptions[0]?.nama ?? ''
    );
  }, [kelasOptions]);

  useEffect(() => {
    setSelectedMapel((current) =>
      current && mapelOptions.some((mapel) => mapel.nama === current)
        ? current
        : mapelOptions[0]?.nama ?? ''
    );
  }, [mapelOptions]);

  const siswaData = useMemo(
    () =>
      selectedKelas
        ? students.filter((student) => student.kelas === selectedKelas)
        : students,
    [selectedKelas, students]
  );

  const handleToggle = (id: number, status: PresensiStatus) => {
    const nextStatus = presensi[id] === status ? null : status;
    setPresensi({ ...presensi, [id]: nextStatus });

    if (nextStatus !== 'izin') {
      setKeterangan((current) => ({ ...current, [id]: '' }));
    }
  };

  const handleKeteranganChange = (id: number, value: string) => {
    setKeterangan((current) => ({ ...current, [id]: value }));
  };

  const handleSubmit = async () => {
    if (isSaving) {
      return;
    }

    if (!selectedMapel) {
      showToast('Pilih mata pelajaran terlebih dahulu.', 'error');
      return;
    }

    if (siswaData.length === 0) {
      showToast('Belum ada data siswa dari backend.', 'error');
      return;
    }

    const allFilled = siswaData.every((student) => presensi[student.id] !== null);
    if (!allFilled) {
      showToast('Harap isi presensi semua siswa!', 'error');
      return;
    }

    const invalidKeterangan = siswaData.some(
      (siswa) => presensi[siswa.id] === 'izin' && !keterangan[siswa.id]?.trim()
    );
    if (invalidKeterangan) {
      showToast('Lengkapi keterangan untuk siswa yang izin!', 'error');
      return;
    }

    setIsSaving(true);

    try {
      await Promise.all(
        siswaData.map((student) =>
          apiPost('/api/attendance-records', {
            nis: student.nis,
            nama: student.nama,
            kelas: student.kelas,
            tahunAjaran: student.tahunAjaran,
            mapel: selectedMapel || null,
            tanggal,
            status: presensi[student.id],
            keterangan: keterangan[student.id] || null,
          })
        )
      );

      showToast('Presensi berhasil disimpan ke backend!', 'success');
    } catch {
      showToast('Gagal menyimpan presensi ke backend.', 'error');
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

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Input Presensi</h2>
        <p className="text-gray-600 mt-1">Catat kehadiran siswa</p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pilih Kelas
            </label>
            <select
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] outline-none"
            >
              {kelasOptions.map((kelas) => (
                <option key={kelas.id} value={kelas.nama}>
                  {kelas.nama}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tanggal
            </label>
            <input
              type="date"
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mata Pelajaran
            </label>
            <select
              value={selectedMapel}
              onChange={(e) => setSelectedMapel(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] outline-none"
            >
              {mapelOptions.map((mapel) => (
                <option key={mapel.id} value={mapel.nama}>
                  {mapel.nama}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Daftar Siswa - Kelas {selectedKelas || '-'}</h3>
          <p className="text-sm text-gray-600 mt-1">
            Pilih satu status presensi untuk setiap siswa
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px]">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="w-14 px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">No</th>
                <th className="w-28 px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">NIS</th>
                <th className="w-64 px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">Nama Siswa</th>
                {statusOptions.map((status) => (
                  <th
                    key={status.key}
                    className="w-20 px-2 py-3 text-center text-xs font-semibold uppercase text-gray-600"
                  >
                    {status.label}
                  </th>
                ))}
                <th className="w-64 px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {siswaData.map((siswa, index) => (
                <motion.tr
                  key={siswa.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3 text-center text-sm text-gray-700">{index + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{siswa.nis}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-gray-900">{siswa.nama}</td>
                  {statusOptions.map((status) => {
                    const isSelected = presensi[siswa.id] === status.key;

                    return (
                      <td key={status.key} className="px-2 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggle(siswa.id, status.key)}
                          aria-label={`${status.label} untuk ${siswa.nama}`}
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                            isSelected
                              ? status.selectedClass
                              : `border-gray-300 text-gray-400 ${status.hoverClass}`
                          }`}
                        >
                          {isSelected && <Check size={16} strokeWidth={3} />}
                        </button>
                      </td>
                    );
                  })}
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={keterangan[siswa.id] ?? ''}
                      onChange={(event) => handleKeteranganChange(siswa.id, event.target.value)}
                      disabled={presensi[siswa.id] !== 'izin'}
                      placeholder={
                        presensi[siswa.id] === 'izin'
                          ? 'Isi keterangan izin'
                          : 'Aktif saat memilih Izin'
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none transition-all disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 focus:border-transparent focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-sm text-gray-600">
              Total: {siswaData.length} siswa |{' '}
              <span className="text-green-600 font-medium">
                Hadir: {Object.values(presensi).filter((s) => s === 'hadir').length}
              </span>{' '}
              |{' '}
              <span className="text-red-600 font-medium">
                Alpha: {Object.values(presensi).filter((s) => s === 'alpha').length}
              </span>{' '}
              |{' '}
              <span className="text-amber-600 font-medium">
                Sakit: {Object.values(presensi).filter((s) => s === 'sakit').length}
              </span>{' '}
              |{' '}
              <span className="text-blue-600 font-medium">
                Izin: {Object.values(presensi).filter((s) => s === 'izin').length}
              </span>
            </div>
            <button
              onClick={handleSubmit}
              className="bg-[#2563EB] text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-all font-medium shadow-md"
            >
              Simpan Presensi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
