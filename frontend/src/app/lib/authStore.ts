import { defaultGuruData, GURU_STORAGE_KEY, type GuruItem } from './guruStore';

export type AppRole = 'admin' | 'guru' | 'siswa';
export type GuruAccess = GuruItem['role'][number];

export interface AuthSession {
  username: string;
  displayName: string;
  role: AppRole;
  guruAccess?: GuruAccess[];
}

export const AUTH_SESSION_KEY = 'pbl4-auth-session';

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const getStoredGuruData = (): GuruItem[] => {
  if (typeof window === 'undefined') {
    return defaultGuruData;
  }

  const storedData = window.localStorage.getItem(GURU_STORAGE_KEY);
  if (!storedData) {
    window.localStorage.setItem(GURU_STORAGE_KEY, JSON.stringify(defaultGuruData));
    return defaultGuruData;
  }

  try {
    const parsedData = JSON.parse(storedData) as GuruItem[];
    return Array.isArray(parsedData) && parsedData.length > 0 ? parsedData : defaultGuruData;
  } catch {
    window.localStorage.setItem(GURU_STORAGE_KEY, JSON.stringify(defaultGuruData));
    return defaultGuruData;
  }
};

const findGuruAccount = (username: string) => {
  const normalizedUsername = normalize(username);
  const compactUsername = normalizedUsername.replace(/\s+/g, '');

  return getStoredGuruData().find((guru) => {
    const normalizedName = normalize(guru.nama);
    const compactName = normalizedName.replace(/\s+/g, '');
    const normalizedEmail = normalize(guru.email);
    const normalizedNip = normalize(guru.nip);
    const firstName = normalizedName.split(' ')[1] ?? normalizedName.split(' ')[0] ?? '';

    return (
      normalizedNip === normalizedUsername ||
      normalizedEmail === normalizedUsername ||
      compactName.includes(compactUsername) ||
      normalizedUsername.includes(firstName)
    );
  });
};

const findGuruFromSession = (session: AuthSession) => {
  const accountByUsername = findGuruAccount(session.username);
  if (accountByUsername) {
    return accountByUsername;
  }

  const normalizedDisplayName = normalize(session.displayName);
  return getStoredGuruData().find(
    (guru) => normalize(guru.nama) === normalizedDisplayName
  );
};

export const resolveLoginSession = (
  username: string,
  password: string,
): AuthSession | null => {
  const normalizedUsername = normalize(username);

  if (!username.trim() || !password.trim() || password !== 'password') {
    return null;
  }

  if (['admin', 'administrator'].includes(normalizedUsername)) {
    return {
      username,
      displayName: 'Administrator',
      role: 'admin',
    };
  }

  if (['siswa', 'student', 'murid'].includes(normalizedUsername)) {
    return {
      username,
      displayName: 'Siswa',
      role: 'siswa',
    };
  }

  const guru = findGuruAccount(username);
  if (!guru || guru.status !== 'Aktif') {
    return null;
  }

  return {
    username,
    displayName: guru.nama,
    role: 'guru',
    guruAccess: guru.role,
  };
};

export const saveAuthSession = (session: AuthSession) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
};

export const getAuthSession = (): AuthSession | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const storedSession = window.localStorage.getItem(AUTH_SESSION_KEY);
  if (!storedSession) {
    return null;
  }

  try {
    const parsedSession = JSON.parse(storedSession) as AuthSession;
    return parsedSession?.role ? parsedSession : null;
  } catch {
    window.localStorage.removeItem(AUTH_SESSION_KEY);
    return null;
  }
};

export const getCurrentGuruAccess = (): GuruAccess[] => {
  const session = getAuthSession();

  if (session?.role !== 'guru') {
    return [];
  }

  const guru = findGuruFromSession(session);

  if (guru?.status === 'Aktif') {
    const nextSession: AuthSession = {
      ...session,
      displayName: guru.nama,
      guruAccess: guru.role,
    };

    saveAuthSession(nextSession);
    return guru.role;
  }

  return session.guruAccess ?? [];
};

export const clearAuthSession = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(AUTH_SESSION_KEY);
};
