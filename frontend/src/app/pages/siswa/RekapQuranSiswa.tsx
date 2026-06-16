'use client';

import { useEffect, useMemo, useState } from 'react';
import { getAuthSession } from '../../lib/authStore';
import {
  formatDisplayDate,
  getQuranSubmissions,
  type QuranSubmissionItem,
} from '../../lib/academicActivityStore';

export default function RekapQuranSiswa() {
  const [submissions, setSubmissions] = useState<QuranSubmissionItem[]>([]);
  const [previewFoto, setPreviewFoto] = useState<string | null>(null);

  useEffect(() => {
    const loadSubmissions = async () => {
      const session = await getAuthSession();
      const items = await getQuranSubmissions(
        session?.username ? { nis: session.username } : {}
      );

      setSubmissions(items);
    };

    void loadSubmissions().catch(() => setSubmissions([]));
  }, []);

  return (
    <div className="space-y-6">
      {previewFoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h3 className="font-semibold text-gray-900">Foto Setoran</h3>
              <button
                type="button"
                onClick={() => setPreviewFoto(null)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                Tutup
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto bg-gray-50 p-4">
              <img
                src={previewFoto}
                alt="Foto setoran Al-Qur'an"
                className="mx-auto max-h-[70vh] max-w-full rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900">Riwayat Setoran</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Tanggal</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Surah</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Ayat</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Penilaian</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Foto</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase text-gray-600">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {submissions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                    Belum ada data setoran Al-Qur&apos;an.
                  </td>
                </tr>
              )}
              {submissions.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{formatDisplayDate(item.tanggal)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.surah}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.ayatMulai}-{item.ayatSelesai}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.penilaian}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {item.fotoSetoran ? (
                      <button
                        type="button"
                        onClick={() => setPreviewFoto(item.fotoSetoran ?? null)}
                        className="inline-flex rounded-lg bg-blue-50 px-3 py-1 text-sm font-medium text-[#2563EB] hover:bg-blue-100"
                      >
                        Lihat Foto
                      </button>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.keterangan || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
