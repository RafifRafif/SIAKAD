'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { getAuthSession } from '../../lib/authStore';
import {
  formatDisplayDate,
  getAttendanceRecords,
  type AttendanceRecordItem,
} from '../../lib/academicActivityStore';

const statusDisplay = {
  H: {
    label: 'Hadir',
    className: 'bg-green-100 text-green-700',
    icon: CheckCircle,
  },
  A: {
    label: 'Alpha',
    className: 'bg-red-100 text-red-700',
    icon: XCircle,
  },
  S: {
    label: 'Sakit',
    className: 'bg-amber-100 text-amber-700',
    icon: XCircle,
  },
  I: {
    label: 'Izin',
    className: 'bg-blue-100 text-blue-700',
    icon: CheckCircle,
  },
  '-': {
    label: 'Belum Ada Data',
    className: 'bg-gray-100 text-gray-600',
    icon: XCircle,
  },
} as const;

const extractCapaianPembelajaran = (value?: string | null) => {
  const match = value?.match(/Capaian Pembelajaran:\s*([\s\S]*)/i);

  return match?.[1]?.trim() || '-';
};

const extractKeteranganPresensi = (value?: string | null) => {
  const keterangan = value?.replace(/Capaian Pembelajaran:\s*[\s\S]*/i, '').trim();

  return keterangan || '-';
};

export default function PresensiSiswa() {
  const [presensiData, setPresensiData] = useState<AttendanceRecordItem[]>([]);

  useEffect(() => {
    const loadPresensi = async () => {
      const session = await getAuthSession();
      const items = await getAttendanceRecords(
        session?.username ? { nis: session.username } : {}
      );
      setPresensiData(items);
    };

    void loadPresensi().catch(() => setPresensiData([]));
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Riwayat Presensi</h3>
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
                  Keterangan
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">
                  Capaian Pembelajaran
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {presensiData.map((item, index) => {
                const status = statusDisplay[item.statusCode] ?? statusDisplay['-'];
                const StatusIcon = status.icon;

                return (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900">{formatDisplayDate(item.tanggal)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.hari ?? '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full font-medium text-sm ${status.className}`}>
                        <StatusIcon size={16} />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {extractKeteranganPresensi(item.keterangan)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {extractCapaianPembelajaran(item.keterangan)}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
