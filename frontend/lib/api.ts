// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — API Client
// Wraps fetch with JWT auth, refresh, and error handling
// ═══════════════════════════════════════════════════════

import { API_BASE_URL } from './constants';

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('tm_access_token');
}

function setToken(token: string) {
  localStorage.setItem('tm_access_token', token);
}

function clearTokens() {
  localStorage.removeItem('tm_access_token');
  localStorage.removeItem('tm_refresh_token');
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('tm_refresh_token');
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) {
      clearTokens();
      return null;
    }
    const { access_token } = await res.json();
    setToken(access_token);
    return access_token;
  } catch {
    return null;
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<ApiResponse<T>> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });

    // Token expired → refresh and retry once
    if (res.status === 401 && retry) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        return apiFetch<T>(path, options, false);
      }
      // Redirect to login if refresh failed
      if (typeof window !== 'undefined') window.location.href = '/login';
      return { data: null, error: 'Session expired' };
    }

    if (!res.ok) {
      const detail = await res.text();
      return { data: null, error: detail || `HTTP ${res.status}` };
    }

    const data: T = await res.json();
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Network error' };
  }
}

// ── Public API methods ─────────────────────────────────

export const api = {
  get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<ApiResponse<T>> {
    const url = params
      ? `${path}?${new URLSearchParams(
          Object.entries(params)
            .filter(([, v]) => v !== undefined)
            .map(([k, v]) => [k, String(v)]),
        ).toString()}`
      : path;
    return apiFetch<T>(url, { method: 'GET' });
  },

  post<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return apiFetch<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  patch<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return apiFetch<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  del<T>(path: string): Promise<ApiResponse<T>> {
    return apiFetch<T>(path, { method: 'DELETE' });
  },

  /** Upload a file (multipart/form-data) */
  upload<T>(path: string, formData: FormData): Promise<ApiResponse<T>> {
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return apiFetch<T>(path, { method: 'POST', body: formData, headers });
  },

  setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('tm_access_token', accessToken);
    localStorage.setItem('tm_refresh_token', refreshToken);
  },

  clearTokens,
};
