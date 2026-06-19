'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  Activity,
  ArrowRight,
  BookOpen,
  ClipboardList,
  GraduationCap,
  PieChart,
  School,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { apiGet } from '../../lib/apiClient';
import {
  emptyDashboardSummary,
  getDashboardSummary,
  type DashboardSummary,
} from '../../lib/academicActivityStore';

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  caption: string;
  href: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

const colorStyles: Record<MetricCardProps['color'], {
  icon: string;
  iconBg: string;
  link: string;
  line: string;
}> = {
  blue: {
    icon: 'text-[#2563EB]',
    iconBg: 'bg-blue-50',
    link: 'text-[#2563EB]',
    line: 'from-[#2563EB] to-blue-200',
  },
  green: {
    icon: 'text-emerald-600',
    iconBg: 'bg-emerald-50',
    link: 'text-emerald-600',
    line: 'from-emerald-600 to-emerald-100',
  },
  purple: {
    icon: 'text-violet-600',
    iconBg: 'bg-violet-50',
    link: 'text-violet-600',
    line: 'from-violet-600 to-violet-100',
  },
  orange: {
    icon: 'text-orange-500',
    iconBg: 'bg-orange-50',
    link: 'text-orange-500',
    line: 'from-orange-500 to-orange-100',
  },
};

function MetricCard({ icon: Icon, label, value, caption, href, color }: MetricCardProps) {
  const styles = colorStyles[color];

  return (
    <div className="relative overflow-hidden rounded-xl border border-blue-50 bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className={`absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r ${styles.line}`} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#111b45]">{label}</p>
          <p className="mt-2 text-3xl font-bold leading-none text-[#08173f]">{value}</p>
          <p className="mt-2 text-sm font-medium text-[#526083]">{caption}</p>
        </div>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${styles.iconBg} ${styles.icon}`}>
          <Icon size={24} />
        </div>
      </div>
      <Link
        href={href}
        className={`mt-4 inline-flex items-center gap-2 text-sm font-semibold ${styles.link} transition-transform hover:translate-x-1`}
      >
        Lihat Detail
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState<DashboardSummary>(emptyDashboardSummary);

  useEffect(() => {
    void getDashboardSummary()
      .then((summaryData) => {
        setSummary(summaryData);
      })
      .catch(() => {
        setSummary(emptyDashboardSummary);
      });
  }, []);

  const totalSiswa = summary.admin.totalSiswa;
  const totalGuru = summary.admin.totalGuru;
  const totalKelas = summary.admin.totalKelas ?? 0;
  const totalPelajaran = summary.admin.totalPelajaran ?? 0;
  const totalAcademicData = totalSiswa + totalGuru + totalKelas + totalPelajaran;
  const donutItems = [
    { label: 'Data Siswa', value: totalSiswa, color: '#2563EB' },
    { label: 'Data Guru', value: totalGuru, color: '#16A34A' },
    { label: 'Data Kelas', value: totalKelas, color: '#7C3AED' },
    { label: 'Data Pelajaran', value: totalPelajaran, color: '#F97316' },
  ];
  let gradientCursor = 0;
  const donutGradient =
    totalAcademicData > 0
      ? donutItems
          .map((item) => {
            const start = gradientCursor;
            gradientCursor += (item.value / totalAcademicData) * 100;
            return `${item.color} ${start}% ${gradientCursor}%`;
          })
          .join(', ')
      : '#E5E7EB 0% 100%';
  const activityItems = [
    {
      icon: Users,
      color: 'bg-blue-50 text-[#2563EB]',
      title: 'Data siswa tersedia',
      description: `${totalSiswa} siswa terdaftar di sistem`,
      time: 'Hari ini',
    },
    {
      icon: GraduationCap,
      color: 'bg-emerald-50 text-emerald-600',
      title: 'Data guru aktif',
      description: `${totalGuru} guru terdata untuk kegiatan akademik`,
      time: 'Hari ini',
    },
    {
      icon: School,
      color: 'bg-violet-50 text-violet-600',
      title: 'Kelas aktif',
      description: `${totalKelas} kelas aktif siap digunakan`,
      time: 'Hari ini',
    },
    {
      icon: BookOpen,
      color: 'bg-orange-50 text-orange-500',
      title: 'Pelajaran aktif',
      description: `${totalPelajaran} pelajaran terhubung ke sistem`,
      time: 'Hari ini',
    },
    {
      icon: ClipboardList,
      color: 'bg-indigo-50 text-indigo-600',
      title: 'Bobot penilaian',
      description: 'Konfigurasi penilaian dapat dikelola dari menu admin',
      time: 'Aktif',
    },
  ];

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#0064ff] via-[#2f68ff] to-[#7660f6] p-6 text-white shadow-sm">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full border border-white/20" />
        <div className="absolute -right-8 bottom-0 h-52 w-[400px] rounded-tl-[200px] bg-white/10" />
        <div className="absolute right-[35%] top-16 grid grid-cols-4 gap-3 opacity-30">
          {Array.from({ length: 16 }).map((_, index) => (
            <span key={index} className="h-1.5 w-1.5 rounded-full bg-white" />
          ))}
        </div>
        <div className="relative max-w-2xl">
          <span className="inline-flex rounded-lg bg-[#0f4eb8]/60 px-4 py-2 text-xs font-semibold uppercase tracking-wide">
            Dashboard Admin
          </span>
          <h2 className="mt-4 text-2xl font-bold leading-tight">
            Selamat Datang, Admin! 👋
          </h2>
          <p className="mt-3 max-w-xl text-sm font-medium leading-6 text-white/95">
            Kelola data akademik, kelas, guru, siswa, dan pembelajaran dalam satu pusat kendali.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={Users}
          label="Data Siswa"
          value={String(totalSiswa)}
          caption="Siswa terdaftar"
          href="/admin/siswa"
          color="blue"
        />
        <MetricCard
          icon={GraduationCap}
          label="Data Guru"
          value={String(totalGuru)}
          caption="Guru terdaftar"
          href="/admin/guru"
          color="green"
        />
        <MetricCard
          icon={School}
          label="Data Kelas"
          value={String(totalKelas)}
          caption="Kelas aktif"
          href="/admin/kelas"
          color="purple"
        />
        <MetricCard
          icon={BookOpen}
          label="Data Pelajaran"
          value={String(totalPelajaran)}
          caption="Pelajaran aktif"
          href="/admin/data-pelajaran"
          color="orange"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-xl border border-blue-50 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <Activity size={24} className="text-[#2563EB]" />
            <h3 className="text-lg font-semibold text-[#111b45]">Aktivitas Terbaru</h3>
          </div>
          <div className="space-y-3">
            {activityItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-center gap-4 border-b border-blue-50 pb-3 last:border-b-0 last:pb-0">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${item.color}`}>
                    <Icon size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#111b45]">{item.title}</p>
                    <p className="truncate text-xs font-medium text-[#526083]">{item.description}</p>
                  </div>
                  <span className="rounded-lg bg-[#f4f7ff] px-3 py-2 text-xs font-medium text-[#526083]">
                    {item.time}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-xl border border-blue-50 bg-white p-6 shadow-sm"
        >
          <div className="absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-blue-50" />
          <div className="relative mb-6 flex items-center gap-3">
            <PieChart size={24} className="text-[#2563EB]" />
            <h3 className="text-lg font-semibold text-[#111b45]">Ringkasan Data Akademik</h3>
          </div>
          <div className="relative grid gap-6 lg:grid-cols-[200px_1fr] lg:items-center">
            <motion.div
              initial={{ opacity: 0, rotate: -90, scale: 0.82 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              transition={{ duration: 0.85, ease: 'easeOut' }}
              className="mx-auto flex h-44 w-44 items-center justify-center rounded-full p-7"
              style={{ background: `conic-gradient(${donutGradient})` }}
            >
              <motion.div
                initial={{ scale: 0.75 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.35, duration: 0.35, ease: 'easeOut' }}
                className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white shadow-inner"
              >
                <span className="text-sm font-medium text-[#526083]">Total</span>
                <span className="text-2xl font-bold text-[#08173f]">{totalAcademicData}</span>
              </motion.div>
            </motion.div>
            <div className="space-y-4">
              {donutItems.map((item, index) => {
                const percent = totalAcademicData > 0 ? ((item.value / totalAcademicData) * 100).toFixed(1) : '0.0';
                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: 18 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.12, duration: 0.35, ease: 'easeOut' }}
                    className="grid grid-cols-[1fr_auto_auto] items-center gap-4 text-sm"
                  >
                    <div className="flex items-center gap-3 font-semibold text-[#111b45]">
                      <motion.span
                        animate={{ scale: [1, 1.25, 1] }}
                        transition={{
                          delay: 0.8 + index * 0.18,
                          duration: 1.8,
                          repeat: Infinity,
                          repeatDelay: 1.2,
                          ease: 'easeInOut',
                        }}
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      {item.label}
                    </div>
                    <span className="font-bold text-[#111b45]">{item.value}</span>
                    <span className="min-w-12 text-right font-semibold text-[#526083]">{percent}%</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
