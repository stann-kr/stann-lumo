import { NextRequest, NextResponse } from 'next/server';
import { getEnv } from '@/lib/db';
import { createSession, buildSessionCookieHeader } from '@/lib/auth';

/**
 * Web Crypto API 기반 상수 시간 문자열 비교
 * 타이밍 사이드 채널 공격 방지를 위해 두 문자열을 SHA-256 해싱 후 비교
 */
async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [aHash, bHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(a)),
    crypto.subtle.digest('SHA-256', enc.encode(b)),
  ]);
  const aBytes = new Uint8Array(aHash);
  const bBytes = new Uint8Array(bHash);
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) {
    diff |= aBytes[i] ^ bBytes[i];
  }
  return diff === 0;
}

export async function POST(request: NextRequest) {
  try {
    const { password } = (await request.json()) as { password: string };

    const { ADMIN_PASSWORD } = getEnv();

    if (!ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_CONFIGURED', message: 'Admin password not configured on server' } },
        { status: 401 },
      );
    }

    const isValid = await timingSafeEqual(password, ADMIN_PASSWORD);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid password' } },
        { status: 401 },
      );
    }

    const sessionId = await createSession();

    const response = NextResponse.json({ success: true });
    response.headers.set('Set-Cookie', buildSessionCookieHeader(sessionId));

    return response;
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: 'Bad request' } },
      { status: 400 },
    );
  }
}
