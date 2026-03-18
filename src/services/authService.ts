/**
 * 인증 서비스
 *
 * 로그인/로그아웃/세션 확인 API 호출 래퍼.
 */

import { apiPost, apiGet } from './apiClient';

/**
 * 로그인
 * @param password  어드민 비밀번호
 * @returns         성공 여부
 */
export async function login(password: string): Promise<boolean> {
  const res = await apiPost<void>('/api/auth/login', { password });
  return res.success;
}

/**
 * 로그아웃
 */
export async function logout(): Promise<void> {
  await apiPost<void>('/api/auth/logout', {});
}

/**
 * 세션 유효성 확인
 * @returns  인증 여부
 */
export async function checkSession(): Promise<boolean> {
  const res = await apiGet<{ authenticated: boolean }>('/api/auth/session');
  return res.success && (res.data?.authenticated ?? false);
}
