'use client';

import Image from 'next/image';
import { motion } from 'motion/react';

export function DashboardPreview() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 to-white">
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
            💻 Preview Dashboard
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Antarmuka yang Mudah & Modern
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Dashboard yang dirancang untuk kemudahan navigasi dan pengalaman pengguna yang optimal
          </p>
        </motion.div>

        {/* Dashboard Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative"
        >
          {/* Laptop Frame */}
          <div className="relative mx-auto max-w-5xl">
            {/* Screen */}
            <div className="bg-gray-900 rounded-t-2xl p-3 shadow-2xl">
              <div className="bg-white rounded-lg overflow-hidden">
                <Image
                  src="/dashboard.png"
                  alt="Dashboard Preview"
                  width={1600}
                  height={900}
                  className="block w-full h-auto"
                  priority={false}
                />
              </div>
            </div>
            {/* Base */}
            <div className="bg-gray-800 h-6 rounded-b-2xl shadow-2xl"></div>
            <div className="bg-gray-700 h-1 w-48 mx-auto rounded-b-lg"></div>
          </div>

          {/* Floating Feature Cards */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="absolute top-10 -left-4 sm:left-0 bg-white p-4 rounded-xl shadow-xl max-w-[200px] hidden lg:block"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">📊</span>
              </div>
              <div>
                <div className="text-xs text-gray-500">Total Siswa</div>
                <div className="font-bold text-gray-900">524</div>
              </div>
            </div>
            <div className="text-xs text-green-600 font-medium">↑ 12% dari bulan lalu</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="absolute top-32 -right-4 sm:right-0 bg-white p-4 rounded-xl shadow-xl max-w-[200px] hidden lg:block"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-xl">📈</span>
              </div>
              <div>
                <div className="text-xs text-gray-500">Presensi Hari Ini</div>
                <div className="font-bold text-gray-900">98%</div>
              </div>
            </div>
            <div className="text-xs text-blue-600 font-medium">Sangat Baik!</div>
          </motion.div>
        </motion.div>

        {/* Features Highlight */}
        <div className="grid sm:grid-cols-3 gap-6 mt-16">
          <div className="text-center">
            <div className="text-3xl mb-2">⚡</div>
            <div className="font-semibold text-gray-900 mb-1">Real-time Updates</div>
            <div className="text-sm text-gray-600">Data terupdate secara otomatis</div>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">📱</div>
            <div className="font-semibold text-gray-900 mb-1">Responsive Design</div>
            <div className="text-sm text-gray-600">Akses dari desktop hingga mobile</div>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">🎨</div>
            <div className="font-semibold text-gray-900 mb-1">Modern Interface</div>
            <div className="text-sm text-gray-600">UI yang intuitif dan menarik</div>
          </div>
        </div>
      </div>
    </section>
  );
}
