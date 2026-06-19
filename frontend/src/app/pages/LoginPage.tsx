'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { resolveLoginSession } from '../lib/authStore';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const loginResult = await resolveLoginSession(formData.username, formData.password);

      if (!loginResult) {
        setError('Akun tidak ditemukan atau password salah.');
        setIsLoading(false);
        return;
      }

      void router.push(loginResult.redirectTo);
    } catch {
      setError('Tidak bisa terhubung ke server backend.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4 font-['Poppins',sans-serif]">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Illustration */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:block"
        >
          <div className="text-center mb-8">
            <div className="flex items-center gap-3 justify-center mb-4">
              <img src="/logo.png" alt="Logo" className="h-16 w-16" />
              <div className="text-left">
                <div className="text-[#2563EB] font-bold text-xl">
                  SMA IT Ulil Albab
                </div>
                <div className="text-gray-600 text-sm">Sistem Informasi Akademik</div>
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Selamat Datang
            </h2>
            <p className="text-gray-600">
              Silakan login untuk mengakses sistem informasi akademik
            </p>
          </div>
          <div className="relative mx-auto max-w-[430px]">
            <img
              src="/siswa2.jpeg"
              alt="Students"
              className="w-full rounded-2xl shadow-2xl"
            />
          </div>
        </motion.div>

        {/* Right Side - Login Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full"
        >
          <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-12">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center gap-3 justify-center mb-8">
              <img src="/logo.png" alt="Logo" className="h-14 w-14" />
              <div className="text-left">
                <div className="text-[#2563EB] font-bold text-lg">
                  SMA IT Ulil Albab
                </div>
                <div className="text-gray-600 text-xs">Sistem Informasi Akademik</div>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-2">Login</h3>
            <p className="text-gray-600 mb-8">
              Masukkan akun Anda untuk melanjutkan
            </p>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700"
              >
                <AlertCircle size={20} />
                <span className="text-sm">{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  placeholder="Masukkan username"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Masukkan password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:border-transparent outline-none transition-all pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#2563EB] text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-all font-semibold shadow-lg hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={20} />
                    <span>Login</span>
                  </>
                )}
              </button>
            </form>

            {/* Back to Home */}
            <div className="mt-6 text-center">
              <button
                onClick={() => void router.push('/')}
                className="text-sm text-gray-600 hover:text-[#2563EB] transition-colors"
              >
                ← Kembali ke Beranda
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
