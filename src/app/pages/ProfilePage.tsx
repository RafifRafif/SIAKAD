'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Eye, EyeOff, KeyRound, Save } from 'lucide-react';
import { motion } from 'motion/react';
import { useToast, Toast } from '../components/dashboard/Toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { apiRequest } from '../lib/api';
import { getAuthState, type AuthState } from '../lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000/api/v1';

type ProfileResponse = {
  id: number;
  name: string;
  username: string;
  email: string | null;
  phone: string | null;
  role: AuthState['role'];
  profile_photo_url: string | null;
  student: {
    nis: string;
    class?: {
      name: string;
    } | null;
  } | null;
  teacher: {
    nip: string;
  } | null;
};

const roleLabels = {
  admin: 'Admin',
  'guru-kelas': 'Guru Kelas',
  'guru-mapel': 'Guru Mapel',
  siswa: 'Siswa',
};

export default function ProfilePage() {
  const { toasts, showToast, removeToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [authState, setAuthState] = useState<AuthState | null>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [profileIdentity, setProfileIdentity] = useState({
    roleLabel: 'Pengguna',
    identifierLabel: 'ID',
    identifierValue: '-',
    classLabel: '-',
  });
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [formData, setFormData] = useState({
    nama: 'Muhammad Rizki',
    email: 'rizki@example.com',
    telepon: '08123456789',
    alamat: 'Jl. Pendidikan No. 123, Batam',
    tanggalLahir: '2008-05-15',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authState?.username) {
      showToast('Silakan login ulang terlebih dahulu.', 'error');
      return;
    }

    try {
      const response = await apiRequest<{ data: ProfileResponse }>('/auth/profile', {
        method: 'POST',
        body: {
          username: authState.username,
          name: formData.nama,
          email: formData.email || null,
          phone: formData.telepon || null,
        },
      });

      setProfilePhotoUrl(response.data.profile_photo_url);
      showToast('Profile berhasil diupdate!', 'success');
      setIsEditing(false);
    } catch {
      showToast('Gagal menyimpan profil ke backend.', 'error');
    }
  };

  const resetPasswordForm = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setShowPassword({
      currentPassword: false,
      newPassword: false,
      confirmPassword: false,
    });
  };
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const currentAuthState = getAuthState();
    if (currentAuthState) {
      setAuthState(currentAuthState);
    }
  }, []);

  useEffect(() => {
    if (!authState?.username) {
      return;
    }

    const controller = new AbortController();

    const loadProfile = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/auth/me?username=${encodeURIComponent(authState.username)}`,
          {
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error('Gagal mengambil profil.');
        }

        const payload = (await response.json()) as { data: ProfileResponse };
        const user = payload.data;

        setFormData((current) => ({
          ...current,
          nama: user.name,
          email: user.email ?? '',
          telepon: user.phone ?? '',
        }));
        setProfilePhotoUrl(user.profile_photo_url);
        setProfileIdentity({
          roleLabel: roleLabels[user.role] ?? 'Pengguna',
          identifierLabel: user.student ? 'NIS' : user.teacher ? 'NIP' : 'Username',
          identifierValue: user.student?.nis ?? user.teacher?.nip ?? user.username,
          classLabel: user.student?.class?.name
            ? `${roleLabels[user.role]} - ${user.student.class.name}`
            : roleLabels[user.role] ?? 'Pengguna',
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          showToast('Gagal memuat profil dari backend.', 'error');
        }
      }
    };

    void loadProfile();

    return () => controller.abort();
  }, [authState, showToast]);

  const togglePasswordVisibility = (
    field: 'currentPassword' | 'newPassword' | 'confirmPassword',
  ) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      showToast('Semua field password wajib diisi.', 'error');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      showToast('Password baru minimal 8 karakter.', 'error');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('Konfirmasi password tidak cocok.', 'error');
      return;
    }

    if (!authState?.username) {
      showToast('Silakan login ulang terlebih dahulu.', 'error');
      return;
    }

    try {
      await apiRequest('/auth/password', {
        method: 'POST',
        body: {
          username: authState.username,
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword,
          new_password_confirmation: passwordData.confirmPassword,
        },
      });

      showToast('Password berhasil diperbarui!', 'success');
      resetPasswordForm();
      setIsPasswordModalOpen(false);
    } catch {
      showToast('Gagal memperbarui password.', 'error');
    }
  };

  const getInitials = () =>
    formData.nama
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'U';

  const uploadProfilePhoto = async (file: File) => {
    if (!authState?.username) {
      showToast('Silakan login ulang terlebih dahulu.', 'error');
      return;
    }

    setIsUploadingPhoto(true);

    try {
      const payload = new FormData();
      payload.append('username', authState.username);
      payload.append('name', formData.nama);
      if (formData.email.trim()) {
        payload.append('email', formData.email.trim());
      }
      if (formData.telepon.trim()) {
        payload.append('phone', formData.telepon.trim());
      }
      payload.append('profile_photo', file);

      const response = await fetch(`${API_BASE_URL}/auth/profile`, {
        method: 'POST',
        body: payload,
      });

      if (!response.ok) {
        throw new Error('Gagal mengunggah foto profil.');
      }

      const result = (await response.json()) as { data: ProfileResponse };
      setProfilePhotoUrl(result.data.profile_photo_url);
      showToast('Foto profil berhasil diperbarui!', 'success');
    } catch {
      showToast('Upload foto profil gagal. Pastikan backend aktif.', 'error');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePhotoSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    await uploadProfilePhoto(file);
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

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
        <p className="text-gray-600 mt-1">Kelola informasi akun Anda</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1"
        >
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
            <div className="relative inline-block mb-4">
              {profilePhotoUrl ? (
                <img
                  src={profilePhotoUrl}
                  alt="Foto profil"
                  className="h-32 w-32 rounded-full object-cover"
                />
              ) : (
                <div className="w-32 h-32 bg-gradient-to-br from-[#2563EB] to-blue-400 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                  {getInitials()}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="absolute bottom-0 right-0 w-10 h-10 bg-[#2563EB] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Camera size={20} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelection}
                className="hidden"
              />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{formData.nama}</h3>
            <p className="text-gray-600 mb-4">{profileIdentity.classLabel}</p>
            <div className="pt-4 border-t border-gray-200 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{profileIdentity.identifierLabel}:</span>
                <span className="font-medium text-gray-900">{profileIdentity.identifierValue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium text-xs">
                  Aktif
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Profile Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Informasi Pribadi</h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-[#2563EB] hover:bg-blue-50 rounded-lg transition-colors font-medium"
                >
                  Edit Profile
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] outline-none disabled:bg-gray-50 disabled:text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] outline-none disabled:bg-gray-50 disabled:text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telepon
                  </label>
                  <input
                    type="tel"
                    value={formData.telepon}
                    onChange={(e) => setFormData({ ...formData, telepon: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] outline-none disabled:bg-gray-50 disabled:text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tanggal Lahir
                  </label>
                  <input
                    type="date"
                    value={formData.tanggalLahir}
                    onChange={(e) =>
                      setFormData({ ...formData, tanggalLahir: e.target.value })
                    }
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] outline-none disabled:bg-gray-50 disabled:text-gray-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alamat
                </label>
                <textarea
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  disabled={!isEditing}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2563EB] outline-none disabled:bg-gray-50 disabled:text-gray-600"
                />
              </div>

              {isEditing && (
                <div className="flex gap-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 bg-[#2563EB] text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all font-medium shadow-md"
                  >
                    <Save size={20} />
                    <span>Simpan Perubahan</span>
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Security Section */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Keamanan</h3>
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(true)}
              className="w-full text-left px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Ubah Password</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Update password untuk keamanan akun
                  </p>
                </div>
                <span className="text-gray-400">→</span>
              </div>
            </button>
          </div>
        </motion.div>
      </div>

      <Dialog
        open={isPasswordModalOpen}
        onOpenChange={(open) => {
          setIsPasswordModalOpen(open);
          if (!open) {
            resetPasswordForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900">
              <KeyRound size={18} className="text-[#2563EB]" />
              Ubah Password
            </DialogTitle>
            <DialogDescription>
              Masukkan password lama dan password baru untuk memperbarui keamanan akun.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password Lama
              </label>
              <div className="relative">
                <input
                  type={showPassword.currentPassword ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, currentPassword: e.target.value })
                  }
                  placeholder="Masukkan password lama"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 pr-12 outline-none transition focus:ring-2 focus:ring-[#2563EB]"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('currentPassword')}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-gray-400 transition-colors hover:text-[#2563EB]"
                  aria-label={
                    showPassword.currentPassword
                      ? 'Sembunyikan password lama'
                      : 'Lihat password lama'
                  }
                >
                  {showPassword.currentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password Baru
              </label>
              <div className="relative">
                <input
                  type={showPassword.newPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, newPassword: e.target.value })
                  }
                  placeholder="Minimal 8 karakter"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 pr-12 outline-none transition focus:ring-2 focus:ring-[#2563EB]"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('newPassword')}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-gray-400 transition-colors hover:text-[#2563EB]"
                  aria-label={
                    showPassword.newPassword
                      ? 'Sembunyikan password baru'
                      : 'Lihat password baru'
                  }
                >
                  {showPassword.newPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Konfirmasi Password Baru
              </label>
              <div className="relative">
                <input
                  type={showPassword.confirmPassword ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                  }
                  placeholder="Ulangi password baru"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 pr-12 outline-none transition focus:ring-2 focus:ring-[#2563EB]"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirmPassword')}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-gray-400 transition-colors hover:text-[#2563EB]"
                  aria-label={
                    showPassword.confirmPassword
                      ? 'Sembunyikan konfirmasi password'
                      : 'Lihat konfirmasi password'
                  }
                >
                  {showPassword.confirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetPasswordForm();
                  setIsPasswordModalOpen(false);
                }}
                className="border-gray-300 text-gray-700"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-[#2563EB] text-white hover:bg-blue-700"
              >
                Simpan Password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
