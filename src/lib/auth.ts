/**
 * 세션 관리 유틸리티
 *
 * D1 admin_sessions 테이블을 사용한 HTTP-only 쿠키 기반 인증.
 * - 세션 ID: crypto.randomUUID()
 * - 만료: 7일
 * - 쿠키명: admin_session
 */

import { getDB } from './db';

/** 세션 만료 기간 (7일, ms) */
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** 쿠키 이름 */
export const SESSION_COOKIE_NAME = 'admin_session';

/** Docker 개발 환경 폴백 세션 값 */
export const DEV_SESSION_VALUE = 'dev-session';

/**
 * D1에 새 세션 생성 후 세션 ID 반환
 * DB가 없는 개발 환경에서는 DEV_SESSION_VALUE 반환
 */
export async function createSession(): Promise<string> {
  const db = getDB();

  if (!db) {
    // Docker 개발 환경 전용 폴백 — 프로덕션에서는 DB 없이 세션 생성 불가
    if (process.env.NODE_ENV === 'production') {
      throw new Error('DB unavailable in production — cannot create session');
    }
    return DEV_SESSION_VALUE;
  }

  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  await db
    .prepare('INSERT INTO admin_sessions (id, expires_at) VALUES (?, ?)')
    .bind(sessionId, expiresAt)
    .run();

  return sessionId;
}

/**
 * 세션 ID 유효성 검증
 * @param sessionId 쿠키에서 추출한 세션 ID
 * @returns 유효하면 true, 만료/미존재 시 false
 */
export async function validateSession(sessionId: string): Promise<boolean> {
  // 개발 환경 전용 폴백 — 프로덕션에서는 절대 허용 안 함
  if (sessionId === DEV_SESSION_VALUE) {
    if (process.env.NODE_ENV === 'production') return false;
    return true;
  }

  const db = getDB();
  if (!db) return false;

  const now = new Date().toISOString();
  const row = await db
    .prepare('SELECT id FROM admin_sessions WHERE id = ? AND expires_at > ?')
    .bind(sessionId, now)
    .first<{ id: string }>();

  return row !== null;
}

/**
 * 세션 삭제
 * @param sessionId 삭제할 세션 ID
 */
export async function deleteSession(sessionId: string): Promise<void> {
  if (sessionId === DEV_SESSION_VALUE) return;

  const db = getDB();
  if (!db) return;

  await db
    .prepare('DELETE FROM admin_sessions WHERE id = ?')
    .bind(sessionId)
    .run();
}

/**
 * 만료된 세션 일괄 정리
 */
export async function pruneExpiredSessions(): Promise<void> {
  const db = getDB();
  if (!db) return;

  const now = new Date().toISOString();
  await db
    .prepare('DELETE FROM admin_sessions WHERE expires_at <= ?')
    .bind(now)
    .run();
}

/**
 * 세션 쿠키 옵션 생성
 * @param sessionId 세션 ID (빈 문자열이면 만료 처리)
 */
export function buildSessionCookieHeader(sessionId: string): string {
  const isExpire = sessionId === '';
  const maxAge = isExpire ? 0 : SESSION_TTL_MS / 1000;
  const isProd = process.env.NODE_ENV === 'production';

  const parts = [
    `${SESSION_COOKIE_NAME}=${sessionId}`,
    `Max-Age=${maxAge}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ];

  if (isProd) parts.push('Secure');

  return parts.join('; ');
}
