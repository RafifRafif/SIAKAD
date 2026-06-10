import { apiGet, apiPost, apiRequest, ApiError } from './apiClient';
import type { GuruItem } from './guruStore';

export type AppRole = 'admin' | 'guru' | 'siswa';
export type GuruAccess = GuruItem['role'][number];

export interface AuthSession {
  username: string;
  displayName: string;
  role: AppRole;
  guruAccess?: GuruAccess[];
}

interface BackendAuthUser {
  name: string;
  username: string;
  role: AppRole;
  guruAccess?: GuruAccess[];
}

interface BackendAuthResponse {
  redirect_to: string;
  user: BackendAuthUser;
  access_token?: string;
  token_type?: 'Bearer';
  expires_in?: number;
}

const toAuthSession = (user: BackendAuthUser): AuthSession => ({
  username: user.username,
  displayName: user.name,
  role: user.role,
  guruAccess: user.guruAccess ?? [],
});

export const resolveLoginSession = async (
  username: string,
  password: string,
): Promise<{ session: AuthSession; redirectTo: string } | null> => {
  try {
    const response = await apiPost<BackendAuthResponse>('/api/auth/login', {
      username,
      password,
    });

    return {
      session: toAuthSession(response.user),
      redirectTo: response.redirect_to,
    };
  } catch (error) {
    if (error instanceof ApiError && [401, 422].includes(error.status)) {
      return null;
    }

    throw error;
  }
};

export const getAuthSession = async (): Promise<AuthSession | null> => {
  try {
    const response = await apiGet<BackendAuthResponse>('/api/auth/me');
    return toAuthSession(response.user);
  } catch (error) {
    if (error instanceof ApiError && [401, 403].includes(error.status)) {
      return null;
    }

    throw error;
  }
};

export const getCurrentGuruAccess = async (): Promise<GuruAccess[]> => {
  const session = await getAuthSession();
  return session?.role === 'guru' ? session.guruAccess ?? [] : [];
};

export const clearAuthSession = async () => {
  try {
    await apiRequest('/api/auth/logout', { method: 'POST' });
  } catch (error) {
    if (error instanceof ApiError && [401, 419].includes(error.status)) {
      return;
    }

    throw error;
  }
};
