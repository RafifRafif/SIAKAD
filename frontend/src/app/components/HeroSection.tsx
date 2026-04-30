'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';

export function HeroSection() {
  const router = useRouter();

  return (
    <section id="home" className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block px-4 py-2 bg-blue-100 text-[#2563EB] rounded-full text-sm font-medium mb-6">
              🎓 Platform Akademik Digital
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Sistem Informasi Akademik{' '}
              <span className="text-[#2563EB]">Terintegrasi</span> untuk Sekolah
            </h1>
            
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Kelola presensi, nilai, hafalan Al-Qur'an, dan laporan akademik dalam satu sistem yang mudah, cepat, dan aman. 
              Memudahkan admin, guru, dan siswa dalam mengakses informasi akademik secara real-time.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => void router.push('/login')}
                className="bg-[#2563EB] text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-all font-medium shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
              >
                Mulai Sekarang
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <a href="#fitur" className="border-2 border-[#2563EB] text-[#2563EB] px-8 py-4 rounded-lg hover:bg-blue-50 transition-all font-medium text-center">
                Pelajari Lebih Lanjut
              </a>
            </div>
          </motion.div>

          {/* Right Image */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1719159381916-062fa9f435a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdXNsaW0lMjBzdHVkZW50cyUyMHN0dWR5aW5nJTIwY2xhc3Nyb29tfGVufDF8fHx8MTc3NDY1MTgwOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Students Learning"
                className="w-full h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2563EB]/20 to-transparent"></div>
            </div>
            
            {/* Floating Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-xl"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">✓</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Terintegrasi</div>
                  <div className="text-sm text-gray-600">Semua dalam satu sistem</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
