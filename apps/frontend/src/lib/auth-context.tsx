'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type {
  AccessTokenResponse,
  CurrentUserResponse,
} from '@eduanalyze-ai/shared-types';
import { apiClient, getAccessToken, setAccessToken, setOnRefreshFailed } from './api-client';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  user: CurrentUserResponse | null;
  status: AuthStatus;
  // Called after a call that issued a fresh access token (verify-otp,
  // google/complete-registration) — stores it in memory and loads /me.
  login: (accessToken: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUserResponse | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const router = useRouter();

  const loadCurrentUser = useCallback(async () => {
    const { data } = await apiClient.get<CurrentUserResponse>('/auth/me');
    setUser(data);
    setStatus('authenticated');
  }, []);

  const login = useCallback(
    async (accessToken: string) => {
      setAccessToken(accessToken);
      await loadCurrentUser();
    },
    [loadCurrentUser],
  );

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      setAccessToken(null);
      setUser(null);
      setStatus('unauthenticated');
      router.push('/login');
    }
  }, [router]);

  // Revives the session on mount/reload — the access token was never
  // persisted anywhere, so the only way back in is the httpOnly refresh
  // cookie auto-attaching to this call.
  useEffect(() => {
    setOnRefreshFailed(() => {
      setAccessToken(null);
      setUser(null);
      setStatus('unauthenticated');
    });

    (async () => {
      try {
        const { data } = await apiClient.post<AccessTokenResponse>('/auth/refresh');
        setAccessToken(data.accessToken);
        await loadCurrentUser();
      } catch {
        setStatus('unauthenticated');
      }
    })();

    return () => setOnRefreshFailed(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

// Exposed for code that needs a synchronous read outside React (rare;
// prefer useAuth() in components).
export { getAccessToken };
