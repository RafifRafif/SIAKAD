'use client';

import { Calendar, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'motion/react';

const presensiData = [
  { tanggal: '27 Mar 2026', hari: 'Jumat', status: 'Hadir', waktu: '07:15' },
  { tanggal: '26 Mar 2026', hari: 'Kamis', status: 'Hadir', waktu: '07:10' },
  { tanggal: '25 Mar 2026', hari: 'Rabu', status: 'Hadir', waktu: '07:20' },
  { tanggal: '24 Mar 2026', hari: 'Selasa', status: 'Tidak Hadir', waktu: '-', keterangan: 'Sakit' },
  { tanggal: '23 Mar 2026', hari: 'Senin', status: 'Hadir', waktu: '07:05' },
  { tanggal: '20 Mar 2026', hari: 'Jumat', status: 'Hadir', waktu: '07:18' },
  { tanggal: '19 Mar 2026', hari: 'Kamis', status: 'Hadir', waktu: '07:12' },
  { tanggal: '18 Mar 2026', hari: 'Rabu', status: 'Hadir', waktu: '07:08' },
];

export default function PresensiSiswa() {
  const totalHari = presensiData.length;
  const totalHadir = presensiData.filter((p) => p.status === 'Hadir').length;
  const persentaseHadir = ((totalHadir / totalHari) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Rekap Presensi</h2>
        <p className="text-gray-600 mt-1">Pantau kehadiran Anda</p>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Calendar size={24} className="text-[#2563EB]" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Hari</p>
              <p className="text-2xl font-bold text-gray-900">{totalHari}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Hadir</p>
              <p className="text-2xl font-bold text-gray-900">{totalHadir}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Calendar size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Persentase Hadir</p>
              <p className="text-2xl font-bold text-gray-900">{persentaseHadir}%</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Presensi Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Riwayat Presensi</h3>
          <p className="text-sm text-gray-600 mt-1">Maret 2026</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Tanggal
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Hari
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Waktu
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Keterangan
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {presensiData.map((item, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 text-sm text-gray-900">{item.tanggal}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.hari}</td>
                  <td className="px-6 py-4">
                    {item.status === 'Hadir' ? (
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium text-sm">
                        <CheckCircle size={16} />
                        Hadir
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full font-medium text-sm">
                        <XCircle size={16} />
                        Tidak Hadir
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{item.waktu}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {item.keterangan || '-'}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Additional Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-blue-50 border border-blue-200 rounded-xl p-6"
      >
        <h4 className="font-semibold text-blue-900 mb-2">Informasi</h4>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>
              Presensi dihitung berdasarkan kehadiran di kelas mulai pukul 07:30 pagi
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>Jika tidak hadir, segera hubungi wali kelas dengan surat keterangan</span>
          </li>
          <li className="flex items-start gap-2">
            <span>•</span>
            <span>
              Persentase kehadiran minimal 75% untuk mengikuti ujian akhir semester
            </span>
          </li>
        </ul>
      </motion.div>
    </div>
  );
}
