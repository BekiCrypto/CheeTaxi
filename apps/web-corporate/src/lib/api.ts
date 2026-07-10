// Shared API client for the corporate portal — same auth as admin
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const TOKEN_KEY = 'cheetaxi.accessToken';
const REFRESH_KEY = 'cheetaxi.refreshToken';

export function getTokens() {
  if (typeof window === 'undefined') return null;
  const accessToken = localStorage.getItem(TOKEN_KEY);
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  return accessToken ? { accessToken, refreshToken } : null;
}

export function clearTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export async function api<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
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
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.success === false) {
    throw new Error(body?.error?.message ?? `API error ${res.status}`);
  }
  return body.data as T;
}

export async function login(identifier: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier, password }),
  });
  const body = await res.json();
  if (!res.ok || body?.success === false) throw new Error(body?.error?.message ?? 'Login failed');
  const data = body.data;
  localStorage.setItem(TOKEN_KEY, data.accessToken);
  localStorage.setItem(REFRESH_KEY, data.refreshToken);
  return data;
}
