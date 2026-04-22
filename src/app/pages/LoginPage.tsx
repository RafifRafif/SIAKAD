'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { setAuthState } from '../lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000/api/v1';
const roleLabels = {
  admin: 'Admin',
  'guru-kelas': 'Guru Kelas',
  'guru-mapel': 'Guru Mapel',
  siswa: 'Siswa',
} as const;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'siswa',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const roleOptions = [
    { value: 'admin', label: 'Admin' },
    { value: 'guru-kelas', label: 'Guru Kelas' },
    { value: 'guru-mapel', label: 'Guru Mapel' },
    { value: 'siswa', label: 'Siswa' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!formData.username || !formData.password) {
      setError('Silakan isi semua field!');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      const payload = (await response.json()) as {
        message?: string;
        data?: {
          username: string;
          role: 'admin' | 'guru-kelas' | 'guru-mapel' | 'siswa';
        };
        errors?: {
          username?: string[];
        };
      };

      if (!response.ok || !payload.data) {
        setError(payload.errors?.username?.[0] ?? payload.message ?? 'Login gagal.');
        setIsLoading(false);
        return;
      }

      setAuthState({
        username: payload.data.username,
        role: payload.data.role,
      });

      if (payload.data.role !== formData.role) {
        setError(
          `Akun ini terdaftar sebagai ${roleLabels[payload.data.role]}. Anda akan diarahkan ke halaman yang sesuai.`
        );
      }

      void router.push(`/${payload.data.role}`);
    } catch {
      setError('Tidak dapat terhubung ke backend. Pastikan server backend aktif.');
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
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1719159381916-062fa9f435a6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdXNsaW0lMjBzdHVkZW50cyUyMHN0dWR5aW5nJTIwY2xhc3Nyb29tfGVufDF8fHx8MTc3NDY1MTgwOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
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
              Masukkan credentials Anda untuk melanjutkan
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
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Login Sebagai
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {roleOptions.map((role) => (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, role: role.value })}
                      className={`py-3 px-4 rounded-lg border-2 transition-all font-medium text-sm capitalize ${
                        formData.role === role.value
                          ? 'border-[#2563EB] bg-blue-50 text-[#2563EB]'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {role.label}
                    </button>
                  ))}
                </div>
              </div>

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

              {/* Login Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-xs text-blue-800 mb-2 font-medium">
                  Informasi Login:
                </p>
                <p className="text-xs text-blue-700">
                  Akun aktif saat ini:
                  <span className="font-semibold"> admin, gkelas1, gmapel1, 2024001, 2024002</span>
                  <br />
                  Password semuanya: <span className="font-semibold">password</span>
                </p>
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
