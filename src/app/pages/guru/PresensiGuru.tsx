'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useToast, Toast } from '../../components/dashboard/Toast';

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
  const [presensi, setPresensi] = useState<{ [key: number]: 'hadir' | 'tidak' | null }>(
    Object.fromEntries(siswaData.map((s) => [s.id, null]))
  );
  const [keterangan, setKeterangan] = useState<{ [key: number]: string }>(
    Object.fromEntries(siswaData.map((s) => [s.id, '']))
  );
  const { toasts, showToast, removeToast } = useToast();

  const handleToggle = (id: number, status: 'hadir' | 'tidak') => {
    const nextStatus = presensi[id] === status ? null : status;
    setPresensi({ ...presensi, [id]: nextStatus });

    if (nextStatus !== 'tidak') {
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
      (siswa) => presensi[siswa.id] === 'tidak' && !keterangan[siswa.id].trim()
    );
    if (invalidKeterangan) {
      showToast('Lengkapi keterangan untuk siswa yang tidak hadir!', 'error');
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
          <p className="text-sm text-gray-600 mt-1">Tandai kehadiran siswa</p>
        </div>

        <div className="divide-y divide-gray-200">
          {siswaData.map((siswa, index) => (
            <motion.div
              key={siswa.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-6 hover:bg-gray-50 transition-colors"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-semibold text-gray-600">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{siswa.nama}</p>
                    <p className="text-sm text-gray-600">NIS: {siswa.nis}</p>
                  </div>
                </div>

                <div className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-[520px]">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-end">
                    <button
                      onClick={() => handleToggle(siswa.id, 'hadir')}
                      className={`flex items-center gap-2 px-6 py-3 rounded-lg border-2 transition-all font-medium ${
                        presensi[siswa.id] === 'hadir'
                          ? 'bg-green-50 border-green-500 text-green-700'
                          : 'border-gray-300 text-gray-600 hover:border-green-500'
                      }`}
                    >
                      <Check size={20} />
                      <span>Hadir</span>
                    </button>
                    <button
                      onClick={() => handleToggle(siswa.id, 'tidak')}
                      className={`flex items-center gap-2 px-6 py-3 rounded-lg border-2 transition-all font-medium ${
                        presensi[siswa.id] === 'tidak'
                          ? 'bg-red-50 border-red-500 text-red-700'
                          : 'border-gray-300 text-gray-600 hover:border-red-500'
                      }`}
                    >
                      <X size={20} />
                      <span>Tidak Hadir</span>
                    </button>
                    <input
                      type="text"
                      value={keterangan[siswa.id]}
                      onChange={(e) => handleKeteranganChange(siswa.id, e.target.value)}
                      disabled={presensi[siswa.id] !== 'tidak'}
                      placeholder={
                        presensi[siswa.id] === 'tidak'
                          ? 'Isi alasan tidak hadir'
                          : 'Aktif saat status Tidak Hadir'
                      }
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none lg:w-72 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 focus:ring-2 focus:ring-[#2563EB]"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Total: {siswaData.length} siswa |{' '}
              <span className="text-green-600 font-medium">
                Hadir: {Object.values(presensi).filter((s) => s === 'hadir').length}
              </span>{' '}
              |{' '}
              <span className="text-red-600 font-medium">
                Tidak: {Object.values(presensi).filter((s) => s === 'tidak').length}
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
