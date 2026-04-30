'use client';

import { motion } from 'motion/react';
import { Users, Calendar, FileText, BookOpen, BarChart3, Globe } from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Manajemen Data Siswa',
    description: 'Kelola data siswa dengan mudah dan terorganisir dalam satu platform.',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    icon: Calendar,
    title: 'Presensi Digital',
    description: 'Sistem presensi otomatis dan real-time untuk memantau kehadiran siswa.',
    color: 'bg-green-100 text-green-600',
  },
  {
    icon: FileText,
    title: 'Penilaian & Rapor',
    description: 'Input nilai dan generate rapor digital dengan cepat dan akurat.',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    icon: BookOpen,
    title: 'Setoran Hafalan Al-Qur\'an',
    description: 'Catat dan monitor perkembangan hafalan Al-Qur\'an siswa secara detail.',
    color: 'bg-orange-100 text-orange-600',
  },
  {
    icon: BarChart3,
    title: 'Laporan Akademik',
    description: 'Dashboard analitik lengkap untuk evaluasi performa akademik siswa.',
    color: 'bg-pink-100 text-pink-600',
  },
  {
    icon: Globe,
    title: 'Akses Siswa Online',
    description: 'Siswa dapat mengakses nilai, jadwal, dan informasi akademik kapan saja.',
    color: 'bg-teal-100 text-teal-600',
  },
];

export function FeaturesSection() {
  return (
    <section id="fitur" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-block px-4 py-2 bg-blue-100 text-[#2563EB] rounded-full text-sm font-medium mb-4">
            ✨ Fitur Lengkap
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Fitur Utama Sistem
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Semua kebutuhan administrasi akademik sekolah dalam satu platform terintegrasi
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white p-8 rounded-2xl border border-gray-200 hover:border-[#2563EB] hover:shadow-xl transition-all duration-300 group"
              >
                <div className={`w-14 h-14 ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <Icon size={28} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
