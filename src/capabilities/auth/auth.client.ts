import { apiPost } from '@/services/apiClient';

export interface AdminLoginResult {
  isAuthenticated: boolean;
  errorMessage?: string;
}

const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: '비밀번호가 맞지 않습니다.',
  BAD_REQUEST: '비밀번호를 입력해 주세요.',
  NOT_CONFIGURED: '서버에 관리자 비밀번호가 설정되어 있지 않습니다.',
  DB_UNAVAILABLE: '로그인 상태를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.',
};

export async function authenticateAdmin(password: string): Promise<AdminLoginResult> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (response.ok) return { isAuthenticated: true };

  const data = await response.json() as { error?: { code?: string } };
  return {
    isAuthenticated: false,
    errorMessage: LOGIN_ERROR_MESSAGES[data.error?.code ?? ''] ?? '로그인하지 못했습니다. 다시 시도해 주세요.',
  };
}

export async function login(password: string): Promise<boolean> {
  const response = await apiPost<void>('/api/auth/login', { password });
  return response.success;
}

export async function logout(): Promise<void> {
  await apiPost<void>('/api/auth/logout', {});
}

export async function requestLogout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' });
}

export type AdminSessionState = 'authenticated' | 'unauthenticated' | 'unknown';

/** Keeps "the server said no" apart from "no answer" (offline, waking laptop, server error) so only the former signs the editor out. */
export async function getAdminSessionState(): Promise<AdminSessionState> {
  try {
    const response = await fetch('/api/auth/session', { cache: 'no-store' });
    if (!response.ok) return 'unknown';
    const payload = await response.json() as { data?: { authenticated?: unknown } };
    return payload.data?.authenticated === true ? 'authenticated' : 'unauthenticated';
  } catch {
    return 'unknown';
  }
}

export const ADMIN_HOME_PATH = '/admin/events';

/** Only same-site admin pages may be used as a post-login destination. */
export function adminReturnPath(value: string | null | undefined): string {
  if (!value || !value.startsWith('/admin/') || value.includes('\\')) return ADMIN_HOME_PATH;
  try {
    const url = new URL(value, 'https://admin.invalid');
    return url.origin === 'https://admin.invalid' && url.pathname.startsWith('/admin/')
      ? `${url.pathname}${url.search}`
      : ADMIN_HOME_PATH;
  } catch {
    return ADMIN_HOME_PATH;
  }
}

export function adminLoginHref(returnPath: string): string {
  const next = adminReturnPath(returnPath);
  return next === ADMIN_HOME_PATH ? '/admin' : `/admin?next=${encodeURIComponent(next)}`;
}
