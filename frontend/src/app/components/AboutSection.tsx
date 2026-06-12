'use client';

import { motion } from "motion/react";
import { Target, Eye, Award } from "lucide-react";

export function AboutSection() {
  return (
    <section
      id="tentang"
      className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-white"
    >
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
            🎓 Tentang Kami
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            SMA Islam Terpadu Ulil Albab
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Sekolah Islam terpadu yang menggabungkan kurikulum nasional dengan
            pendidikan karakter Islami
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="/sekolah.jpeg"
                alt="School Building"
                className="w-full h-[400px] object-cover"
              />
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Digitalisasi untuk Pendidikan yang Lebih Baik
            </h3>
            <p className="text-gray-600 leading-relaxed mb-6">
              Sistem Informasi Akademik kami dirancang khusus untuk memenuhi
              kebutuhan sekolah Islam terpadu dalam mengelola administrasi
              akademik secara efisien dan terintegrasi.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              Dengan menggabungkan teknologi modern dan pemahaman mendalam
              tentang kebutuhan pendidikan Islam, kami menghadirkan solusi yang
              memudahkan guru, siswa, dan orang tua dalam memantau perkembangan
              akademik.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 bg-white p-4 rounded-xl shadow-sm">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Target size={20} className="text-[#2563EB]" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 mb-1">Misi</div>
                  <div className="text-sm text-gray-600">
                    Memudahkan administrasi akademik
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-white p-4 rounded-xl shadow-sm">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Eye size={20} className="text-green-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 mb-1">Visi</div>
                  <div className="text-sm text-gray-600">
                    Sekolah digital terdepan
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
