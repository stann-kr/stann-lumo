/**
 * API 클라이언트 — fetch 래퍼
 *
 * 모든 API 호출의 기반이 되는 유틸리티.
 * ApiResponse<T> 형식으로 결과 반환, 네트워크/파싱 에러 처리 포함.
 */

import { notifyAdminUnauthorized } from '@/capabilities/auth/adminSessionEvents';

export interface ApiError {
  code: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

/**
 * fetch 래퍼 — JSON 파싱 및 에러 핸들링
 * @param url    요청 URL
 * @param init   fetch RequestInit 옵션
 * @returns      ApiResponse<T>
 */
export async function apiRequest<T>(
  url: string,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  let res: Response;

  try {
    const headers = new Headers(init?.headers);
    if (!headers.has('Content-Type') && !(typeof FormData !== 'undefined' && init?.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    res = await fetch(url, {
      ...init,
      headers,
    });

  } catch {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: 'Network request failed' },
    };
  }

  if (!res.ok) {
    notifyAdminUnauthorized(url, res.status);
    return {
      success: false,
      error: { code: 'HTTP_ERROR', message: `Request failed with status ${res.status}` },
    };
  }

  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return {
      success: false,
      error: { code: 'INVALID_JSON', message: 'Server returned an invalid JSON response' },
    };
  }

  if (!json || typeof json !== 'object' || typeof (json as ApiResponse<T>).success !== 'boolean') {
    return {
      success: false,
      error: { code: 'INVALID_RESPONSE', message: 'Server returned an invalid response envelope' },
    };
  }

  return json as ApiResponse<T>;
}

/**
 * GET 요청
 */
export function apiGet<T>(url: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(url, { method: 'GET' });
}

/**
 * PUT 요청
 */
export function apiPut<T>(url: string, body: unknown): Promise<ApiResponse<T>> {
  return apiRequest<T>(url, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/**
 * POST 요청
 */
export function apiPost<T>(url: string, body: unknown): Promise<ApiResponse<T>> {
  return apiRequest<T>(url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
