'use client';

import { useEffect, useMemo, useState } from 'react';
import { Calculator, Percent, Save, Trophy } from 'lucide-react';
import { Toast, useToast } from '../../components/dashboard/Toast';
import {
  BOBOT_PENILAIAN_STORAGE_KEY,
  defaultBobotPenilaianConfig,
  type BobotPenilaianItem,
  type GradeRangeItem,
} from '../../lib/bobotPenilaianStore';

const gradeBadgeTone: Record<string, string> = {
  A: 'bg-green-100 text-green-700',
  B: 'bg-blue-100 text-blue-700',
  C: 'bg-yellow-100 text-yellow-700',
  D: 'bg-orange-100 text-orange-700',
  E: 'bg-red-100 text-red-700',
};

export default function BobotPenilaianPage() {
  const [bobotPenilaian, setBobotPenilaian] = useState<BobotPenilaianItem[]>(
    defaultBobotPenilaianConfig.bobot
  );
  const [gradeRanges, setGradeRanges] = useState<GradeRangeItem[]>(
    defaultBobotPenilaianConfig.gradeRanges
  );
  const { toasts, showToast, removeToast } = useToast();

  useEffect(() => {
    const storedConfig = window.localStorage.getItem(BOBOT_PENILAIAN_STORAGE_KEY);
    if (!storedConfig) {
      window.localStorage.setItem(
        BOBOT_PENILAIAN_STORAGE_KEY,
        JSON.stringify(defaultBobotPenilaianConfig)
      );
      return;
    }

    try {
      const parsedConfig = JSON.parse(storedConfig) as typeof defaultBobotPenilaianConfig;
      if (Array.isArray(parsedConfig.bobot) && Array.isArray(parsedConfig.gradeRanges)) {
        setBobotPenilaian(parsedConfig.bobot);
        setGradeRanges(parsedConfig.gradeRanges);
      }
    } catch {
      window.localStorage.setItem(
        BOBOT_PENILAIAN_STORAGE_KEY,
        JSON.stringify(defaultBobotPenilaianConfig)
      );
    }
  }, []);

  const totalBobot = useMemo(
    () => bobotPenilaian.reduce((total, item) => total + Number(item.bobot || 0), 0),
    [bobotPenilaian]
  );

  const sortedGradeRanges = useMemo(
    () => [...gradeRanges].sort((a, b) => b.nilaiMinimum - a.nilaiMinimum),
    [gradeRanges]
  );

  const handleBobotChange = (id: string, value: string) => {
    const parsedValue = Number(value);
    if (Number.isNaN(parsedValue) || parsedValue < 0 || parsedValue > 100) {
      return;
    }

    setBobotPenilaian((current) =>
      current.map((item) => (item.id === id ? { ...item, bobot: parsedValue } : item))
    );
  };

  const handleGradeRangeChange = (
    id: string,
    field: 'nilaiMinimum' | 'nilaiMaksimum',
    value: string
  ) => {
    const parsedValue = Number(value);
    if (Number.isNaN(parsedValue) || parsedValue < 0 || parsedValue > 100) {
      return;
    }

    setGradeRanges((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: parsedValue } : item))
    );
  };

  const handleSave = () => {
    if (totalBobot !== 100) {
      showToast('Total bobot penilaian harus tepat 100%.', 'error');
      return;
    }

    const hasInvalidRange = gradeRanges.some(
      (item) => item.nilaiMinimum > item.nilaiMaksimum
    );
    if (hasInvalidRange) {
      showToast('Rentang grade tidak valid. Cek nilai minimum dan maksimum.', 'error');
      return;
    }

    const normalizedConfig = {
      bobot: bobotPenilaian,
      gradeRanges: [...gradeRanges].sort((a, b) => b.nilaiMinimum - a.nilaiMinimum),
    };

    window.localStorage.setItem(
      BOBOT_PENILAIAN_STORAGE_KEY,
      JSON.stringify(normalizedConfig)
    );
    showToast('Bobot penilaian berhasil disimpan!', 'success');
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

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Bobot Penilaian</h2>
          <p className="mt-1 text-gray-600">
            Atur komposisi nilai dan rentang grade yang dipakai guru mata pelajaran.
          </p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center justify-center gap-2 rounded-lg bg-[#2563EB] px-6 py-3 font-medium text-white shadow-md transition-all hover:bg-blue-700"
        >
          <Save size={20} />
          <span>Simpan Pengaturan</span>
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-3 text-[#2563EB]">
              <Percent size={20} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Komposisi Bobot</h3>
              <p className="text-sm text-gray-600">
                Total bobot semua komponen harus berjumlah 100%.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {bobotPenilaian.map((item) => (
              <div
                key={item.id}
                className="grid gap-3 rounded-xl border border-gray-200 p-4 md:grid-cols-[1fr_180px]"
              >
                <div>
                  <p className="font-medium text-gray-900">{item.jenisPenilaian}</p>
                  <p className="text-sm text-gray-500">
                    Digunakan saat guru mapel input nilai {item.jenisPenilaian.toLowerCase()}.
                  </p>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Bobot (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={item.bobot}
                    onChange={(e) => handleBobotChange(item.id, e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-[#2563EB]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-3 text-green-700">
                <Calculator size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Ringkasan Bobot</h3>
                <p className="text-sm text-gray-600">
                  Pastikan total bobot valid sebelum disimpan.
                </p>
              </div>
            </div>

            <div
              className={`rounded-xl border px-4 py-4 ${
                totalBobot === 100
                  ? 'border-green-200 bg-green-50'
                  : 'border-red-200 bg-red-50'
              }`}
            >
              <p className="text-sm text-gray-600">Total Bobot</p>
              <p className="mt-1 text-3xl font-bold text-gray-900">{totalBobot}%</p>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-yellow-100 p-3 text-yellow-700">
                <Trophy size={20} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Rentang Grade</h3>
                <p className="text-sm text-gray-600">
                  Guru mapel akan memakai rentang ini saat nilai dimasukkan.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {sortedGradeRanges.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-gray-200 p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${
                        gradeBadgeTone[item.grade] ?? 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      Grade {item.grade}
                    </span>
                    <span className="text-sm text-gray-500">
                      {item.nilaiMinimum} - {item.nilaiMaksimum}
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Nilai Minimum
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={item.nilaiMinimum}
                        onChange={(e) =>
                          handleGradeRangeChange(item.id, 'nilaiMinimum', e.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-[#2563EB]"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        Nilai Maksimum
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={item.nilaiMaksimum}
                        onChange={(e) =>
                          handleGradeRangeChange(item.id, 'nilaiMaksimum', e.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:ring-2 focus:ring-[#2563EB]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
