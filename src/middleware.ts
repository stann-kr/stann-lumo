import { NextRequest, NextResponse } from 'next/server';

/**
 * 보안 HTTP 헤더 미들웨어
 * next.config.ts headers()는 OpenNext Cloudflare edge converter에서 미지원 —
 * 미들웨어에서 직접 주입하여 Cloudflare Workers 환경에서도 동작 보장.
 */
export function middleware(_request: NextRequest) {
  const response = NextResponse.next();

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
}

export const config = {
  matcher: [
    /*
     * 정적 파일 및 Next.js 내부 경로 제외:
     * - _next/static, _next/image, favicon.ico 등
     */
    '/((?!_next/static|_next/image|favicon.ico|icon.png).*)',
  ],
};
