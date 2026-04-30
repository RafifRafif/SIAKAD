'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { motion } from 'motion/react';
import { useToast, Toast } from '../../components/dashboard/Toast';

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

const siswaData = [
  { id: 1, nis: '2024001', nama: 'Ahmad Fauzi', status: null },
  { id: 2, nis: '2024002', nama: 'Siti Nurhaliza', status: null },
  { id: 3, nis: '2024003', nama: 'Muhammad Rizki', status: null },
  { id: 4, nis: '2024004', nama: 'Fatimah Azzahra', status: null },
  { id: 5, nis: '2024005', nama: 'Abdullah Rahman', status: null },
];

export default function PresensiGuru() {
  const [selectedKelas, setSelectedKelas] = useState('X-A');
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [presensi, setPresensi] = useState<{ [key: number]: PresensiStatus | null }>(
    Object.fromEntries(siswaData.map((s) => [s.id, null]))
  );
  const [keterangan, setKeterangan] = useState<{ [key: number]: string }>(
    Object.fromEntries(siswaData.map((s) => [s.id, '']))
  );
  const { toasts, showToast, removeToast } = useToast();

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

  const handleSubmit = () => {
    const allFilled = Object.values(presensi).every((status) => status !== null);
    if (!allFilled) {
      showToast('Harap isi presensi semua siswa!', 'error');
      return;
    }

    const invalidKeterangan = siswaData.some(
      (siswa) => presensi[siswa.id] === 'izin' && !keterangan[siswa.id].trim()
    );
    if (invalidKeterangan) {
      showToast('Lengkapi keterangan untuk siswa yang izin!', 'error');
      return;
    }

    showToast('Presensi berhasil disimpan!', 'success');
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
              <option>X-A</option>
              <option>X-B</option>
              <option>XI-A</option>
              <option>XI-B</option>
              <option>XII-A</option>
              <option>XII-B</option>
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
            <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] outline-none">
              <option>Matematika</option>
              <option>Bahasa Indonesia</option>
              <option>Bahasa Inggris</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Daftar Siswa - Kelas {selectedKelas}</h3>
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
                      value={keterangan[siswa.id]}
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
