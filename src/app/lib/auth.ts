export type AuthRole = 'admin' | 'guru-kelas' | 'guru-mapel' | 'siswa';

export type AuthState = {
  username: string;
  role: AuthRole;
};

const AUTH_COOKIE_NAME = 'siakad-auth';
const ONE_DAY_IN_SECONDS = 60 * 60 * 24;

export function getAuthState(): AuthState | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const rawCookie = document.cookie
    .split('; ')
    .find((item) => item.startsWith(`${AUTH_COOKIE_NAME}=`));

  if (!rawCookie) {
    return null;
  }

  try {
    const encodedValue = rawCookie.slice(AUTH_COOKIE_NAME.length + 1);
    return JSON.parse(decodeURIComponent(encodedValue)) as AuthState;
  } catch {
    return null;
  }
}

export function setAuthState(authState: AuthState): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(authState))}; path=/; max-age=${ONE_DAY_IN_SECONDS}; SameSite=Lax`;
}

export function clearAuthState(): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}
