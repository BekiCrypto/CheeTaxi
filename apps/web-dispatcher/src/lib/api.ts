// Shared API client + auth helpers for CheeTaxi dispatcher web app

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const TOKEN_KEY = 'cheetaxi.accessToken';
const REFRESH_KEY = 'cheetaxi.refreshToken';

export function getTokens() {
  if (typeof window === 'undefined') return null;
  // Tokens are shared across admin + dispatcher (same API, same auth)
  const accessToken = localStorage.getItem(TOKEN_KEY);
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  return accessToken ? { accessToken, refreshToken } : null;
}

export function clearTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export async function api<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const tokens = getTokens();
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(tokens?.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  if (res.status === 401) {
    clearTokens();
    if (typeof window !== 'undefined') {
      window.location.href = process.env.NEXT_PUBLIC_ADMIN_URL ?? 'http://localhost:3001/login';
    }
    throw new Error('Unauthorized');
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.success === false) {
    throw new Error(body?.error?.message ?? `API error ${res.status}`);
  }
  return body.data as T;
}
