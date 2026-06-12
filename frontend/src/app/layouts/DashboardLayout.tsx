'use client';

import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarRange,
  ClipboardList,
  FileText,
  BookOpen,
  FolderTree,
  UserCircle,
  LogOut,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { clearAuthSession, getAuthSession, type GuruAccess } from '../lib/authStore';
import { apiGet } from '../lib/apiClient';
import { loadProfilePhotoUrl, PROFILE_PHOTO_UPDATED_EVENT } from '../lib/profilePhoto';

interface DashboardLayoutProps {
  role: 'admin' | 'guru' | 'siswa';
  children: ReactNode;
}

interface DashboardProfileResponse {
  nama: string;
  guruAccess?: GuruAccess[];
  fotoProfil?: string | null;
}

type DashboardRole = DashboardLayoutProps['role'];
type StaticDashboardRole = Exclude<DashboardRole, 'guru'>;

interface MenuItem {
  icon: typeof LayoutDashboard;
  label: string;
  path?: string;
  children?: Array<{
    label: string;
    path: string;
  }>;
}

const menuItems: Record<StaticDashboardRole, MenuItem[]> = {
  admin: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
    { icon: CalendarRange, label: 'Tahun Ajaran', path: '/admin/tahun-ajaran' },
    {
      icon: FolderTree,
      label: 'Manajemen Data',
      children: [
        { label: 'Data Guru', path: '/admin/guru' },
        { label: 'Data Kelas', path: '/admin/kelas' },
        { label: 'Data Pelajaran', path: '/admin/data-pelajaran' },
        { label: 'Data Pembelajaran', path: '/admin/pelajaran' },
        { label: 'Data Siswa', path: '/admin/siswa' },
        { label: 'Bobot Penilaian', path: '/admin/bobot-penilaian' },
      ],
    },
  ],
  siswa: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/siswa' },
    { icon: FileText, label: 'Nilai Saya', path: '/siswa/nilai' },
    { icon: ClipboardList, label: 'Presensi Saya', path: '/siswa/presensi' },
  ],
};

const getGuruMenuItems = (guruAccess: GuruAccess[]): MenuItem[] => {
  const items: MenuItem[] = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/guru' },
  ];

  if (guruAccess.includes('Wali Kelas')) {
    items.push({
      icon: ClipboardList,
      label: 'Wali Kelas',
      children: [
        { label: 'Monitoring Presensi', path: '/guru/monitoring-presensi' },
        { label: 'Monitoring Nilai', path: '/guru/rekap-nilai' },
        { label: "Monitoring Setoran", path: '/guru/riwayat-quran' },
      ],
    });
  }

  if (guruAccess.includes('Guru Mapel')) {
    items.push({
      icon: BookOpen,
      label: 'Guru Mapel',
      children: [
        { label: 'Presensi Kelas', path: '/guru/presensi' },
        { label: 'Rekap Absensi', path: '/guru/rekap-absensi' },
        { label: 'Input Nilai', path: '/guru/nilai' },
        { label: "Setoran Al-Qur'an", path: '/guru/quran' },
        { label: 'Riwayat Setoran', path: '/guru/riwayat-quran' },
      ],
    });
  }

  return items;
};

const roleNames = {
  admin: 'Administrator',
  guru: 'Guru',
  siswa: 'Siswa',
};

export default function DashboardLayout({ role, children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    'Manajemen Data': true,
    'Wali Kelas': true,
    'Guru Mapel': true,
  });
  const [guruAccess, setGuruAccess] = useState<GuruAccess[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const profilePhotoUrlRef = useRef<string | null>(null);
  const photoLoadRequestRef = useRef(0);
  const currentPath = pathname ?? '/';
  const currentMenu = useMemo(
    () => (role === 'guru' ? getGuruMenuItems(guruAccess) : menuItems[role]),
    [guruAccess, role]
  );
  const displayRole =
    role === 'guru' && guruAccess.length > 0
      ? `Guru - ${guruAccess.join(' & ')}`
      : roleNames[role];

  const replaceProfilePhoto = useCallback((nextPhoto: string | null) => {
    if (profilePhotoUrlRef.current && profilePhotoUrlRef.current !== nextPhoto) {
      URL.revokeObjectURL(profilePhotoUrlRef.current);
      profilePhotoUrlRef.current = null;
    }

    if (nextPhoto?.startsWith('blob:')) {
      profilePhotoUrlRef.current = nextPhoto;
    }

    setProfilePhoto(nextPhoto);
  }, []);

  const loadDashboardProfilePhoto = useCallback(async (photoUrl: string | null) => {
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

      replaceProfilePhoto(objectUrl);
    } catch {
      if (photoLoadRequestRef.current === requestId) {
        replaceProfilePhoto(null);
      }
    }
  }, [replaceProfilePhoto]);

  const refreshDashboardProfile = useCallback(async () => {
    try {
      const profile = await apiGet<DashboardProfileResponse>('/api/profile');
      setDisplayName(profile.nama ?? '');

      if (role === 'guru') {
        setGuruAccess(profile.guruAccess ?? []);
      }

      await loadDashboardProfilePhoto(profile.fotoProfil ?? null);
    } catch {
      try {
        const session = await getAuthSession();
        setDisplayName(session?.displayName ?? '');

        if (role === 'guru') {
          setGuruAccess(session?.guruAccess ?? []);
        }
      } catch {
        setDisplayName('');

        if (role === 'guru') {
          setGuruAccess([]);
        }
      }

      replaceProfilePhoto(null);
    }
  }, [loadDashboardProfilePhoto, replaceProfilePhoto, role]);

  useEffect(() => {
    void refreshDashboardProfile();

    const handleProfilePhotoUpdated = () => {
      void refreshDashboardProfile();
    };

    window.addEventListener(PROFILE_PHOTO_UPDATED_EVENT, handleProfilePhotoUpdated);

    return () => {
      window.removeEventListener(PROFILE_PHOTO_UPDATED_EVENT, handleProfilePhotoUpdated);
    };
  }, [refreshDashboardProfile]);

  useEffect(() => () => {
    if (profilePhotoUrlRef.current) {
      URL.revokeObjectURL(profilePhotoUrlRef.current);
      profilePhotoUrlRef.current = null;
    }
  }, []);

  const isMenuActive = (item: MenuItem) => {
    if (item.path) {
      return currentPath === item.path;
    }

    if (item.children) {
      return item.children.some((child) => currentPath === child.path);
    }

    return false;
  };

  const getCurrentPageTitle = () => {
    for (const item of currentMenu) {
      if (item.path === currentPath) {
        return item.label;
      }

      if (item.children) {
        const activeChild = item.children.find((child) => child.path === currentPath);
        if (activeChild) {
          return activeChild.label;
        }
      }
    }

    return 'Dashboard';
  };

  const toggleExpandedMenu = (label: string) => {
    setExpandedMenus((current) => ({
      ...current,
      [label]: !current[label],
    }));
  };

  const renderMenuItems = (isMobile = false) =>
    currentMenu.map((item) => {
      const Icon = item.icon;
      const isActive = isMenuActive(item);
      const isExpanded = expandedMenus[item.label] ?? isActive;

      if (item.children) {
        return (
          <div key={item.label} className="space-y-1">
            <button
              onClick={() => toggleExpandedMenu(item.label)}
              className={`flex w-full items-center justify-between rounded-lg px-4 py-3 transition-all ${
                isActive
                  ? 'bg-blue-50 text-[#2563EB]'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={20} />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <ChevronDown
                size={16}
                className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              />
            </button>

            {isExpanded && (
              <div className="ml-4 space-y-1 border-l border-gray-200 pl-3">
                {item.children.map((child) => {
                  const isChildActive = currentPath === child.path;
                  return (
                    <Link
                      key={child.path}
                      href={child.path}
                      onClick={() => {
                        if (isMobile) {
                          setIsSidebarOpen(false);
                        }
                      }}
                      className={`flex w-full items-center rounded-lg px-4 py-2.5 text-sm transition-all ${
                        isChildActive
                          ? 'bg-[#2563EB] font-medium text-white shadow-md'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      {child.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      }

      return (
        <Link
          key={item.path}
          href={item.path ?? '#'}
          onClick={() => {
            if (isMobile) {
              setIsSidebarOpen(false);
            }
          }}
          className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 transition-all ${
            isActive
              ? 'bg-[#2563EB] text-white shadow-md'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Icon size={20} />
          <span className="text-sm font-medium">{item.label}</span>
        </Link>
      );
    });

  return (
    <div className="min-h-screen bg-gray-50 font-['Poppins',sans-serif]">
      <aside className="hidden border-r border-gray-200 bg-white lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-grow flex-col overflow-y-auto pt-5 pb-4">
          <div className="mb-8 flex items-center gap-3 px-6">
            <Image src="/logo.png" alt="Logo" width={48} height={48} className="h-12 w-12" />
            <div>
              <div className="text-sm font-semibold leading-tight text-[#2563EB]">
                SMA IT Ulil Albab
              </div>
              <div className="text-xs text-gray-600">{displayRole}</div>
            </div>
          </div>
          <nav className="flex-1 space-y-1 px-4">{renderMenuItems()}</nav>
        </div>
      </aside>

      {isSidebarOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-gray-200 bg-white lg:hidden">
            <div className="flex h-full flex-col pt-5 pb-4">
              <div className="mb-8 flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                  <Image
                    src="/logo.png"
                    alt="Logo"
                    width={48}
                    height={48}
                    className="h-12 w-12"
                  />
                  <div>
                    <div className="text-sm font-semibold text-[#2563EB]">
                      SMA IT Ulil Albab
                    </div>
                    <div className="text-xs text-gray-600">{displayRole}</div>
                  </div>
                </div>
                <button onClick={() => setIsSidebarOpen(false)}>
                  <X size={24} className="text-gray-600" />
                </button>
              </div>
              <nav className="flex-1 space-y-1 px-4">{renderMenuItems(true)}</nav>
            </div>
          </aside>
        </>
      )}

      <div className="flex min-h-screen flex-col lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="text-gray-600 lg:hidden"
            >
              <Menu size={24} />
            </button>
            <div className="hidden lg:block">
              <h1 className="text-xl font-semibold text-gray-900">{getCurrentPageTitle()}</h1>
            </div>
            <div className="relative ml-auto">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 rounded-lg px-4 py-2 transition-colors hover:bg-gray-100"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#2563EB] to-blue-400 font-semibold text-white">
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt="Foto profile"
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    (displayName || roleNames[role]).charAt(0)
                  )}
                </div>
                <div className="hidden text-left sm:block">
                  <div className="text-sm font-semibold text-gray-900">
                    {displayName || displayRole}
                  </div>
                  <div className="text-xs text-gray-600">View Profile</div>
                </div>
                <ChevronDown size={16} className="text-gray-600" />
              </button>
              {showProfileMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowProfileMenu(false)}
                  />
                  <div className="absolute right-0 z-50 mt-2 w-48 rounded-lg border border-gray-200 bg-white py-2 shadow-lg">
                    <button
                      onClick={() => {
                        void router.push(`/${role}/profile`);
                        setShowProfileMenu(false);
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
                    >
                      <UserCircle size={18} />
                      <span>Profile</span>
                    </button>
                    <hr className="my-2 border-gray-200" />
                    <button
                      onClick={() => {
                        void clearAuthSession().finally(() => {
                          void router.push('/login');
                        });
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                    >
                      <LogOut size={18} />
                      <span>Logout</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
