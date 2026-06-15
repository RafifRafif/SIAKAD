'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, Eye, EyeOff, KeyRound, Save } from 'lucide-react';
import { motion } from 'motion/react';
import { useToast, Toast } from '../components/dashboard/Toast';
import type { AppRole, GuruAccess } from '../lib/authStore';
import { ApiError, apiGet, apiPut, apiUpload } from '../lib/apiClient';
import { loadProfilePhotoUrl, PROFILE_PHOTO_UPDATED_EVENT } from '../lib/profilePhoto';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';

interface ProfileResponse {
  username: string;
  role: AppRole;
  guruAccess?: GuruAccess[];
  nama: string;
  email?: string | null;
  telepon?: string | null;
  alamat?: string | null;
  tanggalLahir?: string | null;
  fotoProfil?: string | null;
}

export default function ProfilePage() {
  const { toasts, showToast, removeToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [profileRoleLabel, setProfileRoleLabel] = useState('');
  const [identifierLabel, setIdentifierLabel] = useState('Akun');
  const [identifierValue, setIdentifierValue] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewPhotoUrlRef = useRef<string | null>(null);
  const photoLoadRequestRef = useRef(0);
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    telepon: '',
    alamat: '',
    tanggalLahir: '',
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

  useEffect(() => {
    void apiGet<ProfileResponse>('/api/profile')
      .then(applyProfile)
      .catch((error) => showToast(getApiErrorMessage(error, 'Gagal memuat profile.'), 'error'));

    return () => {
      revokePreviewPhoto();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const profile = await apiPut<ProfileResponse>('/api/profile', formData);
      applyProfile(profile);
      showToast('Profile berhasil diupdate!', 'success');
      setIsEditing(false);
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Gagal mengupdate profile.'), 'error');
    }
  };

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (isUploadingPhoto) {
      return;
    }

    const previousPhoto = profilePhoto;
    const previewUrl = URL.createObjectURL(file);
    const payload = new FormData();
    payload.append('fotoProfil', file);
    showPreviewPhoto(previewUrl);
    setIsUploadingPhoto(true);

    try {
      const profile = await apiUpload<ProfileResponse>('/api/profile/photo', payload);
      applyProfile(profile);
      window.dispatchEvent(new Event(PROFILE_PHOTO_UPDATED_EVENT));
      showToast('Foto profile berhasil diupdate!', 'success');
    } catch (error) {
      replaceProfilePhoto(previousPhoto);
      showToast(getApiErrorMessage(error, 'Gagal mengupdate foto profile.'), 'error');
    } finally {
      setIsUploadingPhoto(false);
      event.target.value = '';
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

    try {
      await apiPut('/api/profile/password', passwordData);
      showToast('Password berhasil diperbarui!', 'success');
      resetPasswordForm();
      setIsPasswordModalOpen(false);
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Gagal memperbarui password.'), 'error');
    }
  };

  const profileInitials = formData.nama
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase())
    .join('');

  const applyProfile = (profile: ProfileResponse) => {
    setProfileRoleLabel(profileRoleLabelFromProfile(profile));
    setIdentifierLabel('Akun');
    setIdentifierValue(profile.username);
    void loadProfilePhoto(profile.fotoProfil ?? null);
    setFormData({
      nama: profile.nama ?? '',
      email: profile.email ?? '',
      telepon: profile.telepon ?? '',
      alamat: profile.alamat ?? '',
      tanggalLahir: profile.tanggalLahir ?? '',
    });
  };

  const loadProfilePhoto = async (photoUrl: string | null) => {
    const requestId = photoLoadRequestRef.current + 1;
    photoLoadRequestRef.current = requestId;

    try {
      const objectUrl = await loadProfilePhotoUrl(photoUrl);

      if (photoLoadRequestRef.current !== requestId) {
        if (objectUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(objectUrl);
        }
        return;
      }

      if (objectUrl?.startsWith('blob:')) {
        showPreviewPhoto(objectUrl);
      } else {
        replaceProfilePhoto(objectUrl);
      }
    } catch {
      if (photoLoadRequestRef.current === requestId) {
        replaceProfilePhoto(photoUrl);
      }
    }
  };

  const revokePreviewPhoto = () => {
    if (previewPhotoUrlRef.current) {
      URL.revokeObjectURL(previewPhotoUrlRef.current);
      previewPhotoUrlRef.current = null;
    }
  };

  const replaceProfilePhoto = (nextPhoto: string | null) => {
    if (previewPhotoUrlRef.current && previewPhotoUrlRef.current !== nextPhoto) {
      URL.revokeObjectURL(previewPhotoUrlRef.current);
      previewPhotoUrlRef.current = null;
    }

    setProfilePhoto(nextPhoto);
  };

  const showPreviewPhoto = (previewUrl: string) => {
    revokePreviewPhoto();
    previewPhotoUrlRef.current = previewUrl;
    setProfilePhoto(previewUrl);
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

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1"
        >
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-center">
            <div className="relative inline-block mb-4">
              <div className="w-32 h-32 bg-gradient-to-br from-[#2563EB] to-blue-400 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                {profilePhoto ? (
                  <img
                    src={profilePhoto}
                    alt="Foto profile"
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  profileInitials || 'U'
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handlePhotoChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-10 h-10 bg-[#2563EB] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-700 transition-colors"
              >
                <Camera size={20} />
              </button>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{formData.nama}</h3>
            <p className="text-gray-600 mb-4">{profileRoleLabel}</p>
            <div className="pt-4 border-t border-gray-200 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">{identifierLabel}:</span>
                <span className="font-medium text-gray-900">{identifierValue}</span>
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

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (! (error instanceof ApiError)) {
    return fallback;
  }

  if (
    typeof error.payload === 'object' &&
    error.payload !== null &&
    'errors' in error.payload
  ) {
    const errors = (error.payload as { errors?: Record<string, string[]> }).errors;
    const firstError = errors ? Object.values(errors)[0]?.[0] : null;

    if (firstError) {
      return firstError;
    }
  }

  return error.message || fallback;
};

const profileRoleLabelFromProfile = (profile: ProfileResponse) => {
  if (profile.role === 'guru') {
    return `Guru - ${profile.guruAccess?.join(' & ') || 'Aktif'}`;
  }

  if (profile.role === 'admin') {
    return 'Administrator';
  }

  return 'Siswa';
};
