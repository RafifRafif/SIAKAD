'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'motion/react';
import { Download, FileText, Calendar } from 'lucide-react';
import { apiDownload } from '../../lib/apiClient';
import {
  emptyDashboardSummary,
  getDashboardSummaryWithFilters,
  getReportOptions,
  type DashboardSummary,
  type ReportOptions,
} from '../../lib/academicActivityStore';

const LaporanAdminCharts = dynamic(() => import('./LaporanAdminCharts'), {
  ssr: false,
  loading: () => <ChartGridSkeleton />,
});

function ChartGridSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {[0, 1].map((item) => (
        <div
          key={item}
          className="h-[397px] animate-pulse rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-6 h-6 w-52 rounded bg-gray-200" />
          <div className="h-[300px] rounded-lg bg-gray-100" />
        </div>
      ))}
    </div>
  );
}

export default function LaporanAdmin() {
  const [summary, setSummary] = useState<DashboardSummary>(emptyDashboardSummary);
  const [periode, setPeriode] = useState('Bulanan');
  const [bulan, setBulan] = useState('Data dari backend');
  const [kelas, setKelas] = useState('all');
  const [reportOptions, setReportOptions] = useState<ReportOptions>({
    bulan: [],
    kelas: [],
  });

  useEffect(() => {
    void getReportOptions()
      .then(setReportOptions)
      .catch(() => setReportOptions({ bulan: [], kelas: [] }));
  }, []);

  useEffect(() => {
    void getDashboardSummaryWithFilters({
      bulan,
      kelas,
    })
      .then(setSummary)
      .catch(() => setSummary(emptyDashboardSummary));
  }, [bulan, kelas]);

  const handleExport = () => {
    const params = new URLSearchParams({
      periode,
      bulan,
      kelas,
    });

    void apiDownload(`/api/reports/admin/export?${params.toString()}`, 'laporan-akademik.pdf');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Laporan Akademik</h2>
          <p className="text-gray-600 mt-1">Rekap dan analisis data akademik</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-all font-medium shadow-md"
        >
          <Download size={20} />
          <span>Export PDF</span>
        </button>
      </div>

      {/* Filter Period */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Periode
            </label>
            <select
              value={periode}
              onChange={(event) => setPeriode(event.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] outline-none"
            >
              <option>Bulanan</option>
              <option>Semester</option>
              <option>Tahunan</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bulan
            </label>
            <select
              value={bulan}
              onChange={(event) => setBulan(event.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] outline-none"
            >
              {['Data dari backend', ...reportOptions.bulan].map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kelas
            </label>
            <select
              value={kelas}
              onChange={(event) => setKelas(event.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] outline-none"
            >
              <option value="all">Semua Kelas</option>
              {reportOptions.kelas.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <LaporanAdminCharts bulan={bulan} kelas={kelas} />

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Calendar size={24} className="text-[#2563EB]" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Hari Efektif</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary.guru.hariEfektif ?? summary.guru.presensi}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <FileText size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Rata-rata Kehadiran</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary.admin.presensiHariIni === null ? '0%' : `${summary.admin.presensiHariIni}%`}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <FileText size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Rata-rata Nilai Keseluruhan</p>
              <p className="text-2xl font-bold text-gray-900">
                {summary.admin.rataRataNilai === null ? '0' : summary.admin.rataRataNilai}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
