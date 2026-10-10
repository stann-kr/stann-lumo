import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, validateSession } from './auth.server';

export const PRIVATE_NO_STORE_CACHE_CONTROL = 'private, no-store';

export function privateNoStoreResponse(body: BodyInit | null, init?: ResponseInit): Response {
  const headers = new Headers(init?.headers);
  headers.set('Cache-Control', PRIVATE_NO_STORE_CACHE_CONTROL);
  return new Response(body, { ...init, headers });
}

export function privateNoStoreJson(payload: unknown, init?: ResponseInit): NextResponse {
  const headers = new Headers(init?.headers);
  headers.set('Cache-Control', PRIVATE_NO_STORE_CACHE_CONTROL);
  return NextResponse.json(payload, { ...init, headers });
}

const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * SameSite=Lax still sends the session cookie from sibling subdomains, so a write must come from this origin.
 * Browsers report the request's site; clients that send neither header (tools, tests) are judged by the session alone.
 */
export function isCrossSiteWrite(request: NextRequest): boolean {
  if (READ_METHODS.has(request.method)) return false;
  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite) return fetchSite !== 'same-origin' && fetchSite !== 'none';
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    const originHost = new URL(origin).host;
    return originHost !== request.nextUrl.host && originHost !== request.headers.get('host');
  } catch {
    return true;
  }
}

export async function requireAdminSession(request: NextRequest): Promise<NextResponse | null> {
  if (isCrossSiteWrite(request)) {
    return privateNoStoreJson(
      { success: false, error: { code: 'FORBIDDEN', message: 'Cross-site request blocked' } },
      { status: 403 },
    );
  }

  const sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value ?? '';
  if (!sessionId) {
    return privateNoStoreJson(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'No session' } },
      { status: 401 },
    );
  }

  let isValid = false;
  try {
    isValid = await validateSession(sessionId);
  } catch {
    return privateNoStoreJson(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Session validation failed' } },
      { status: 401 },
    );
  }

  if (!isValid) {
    return privateNoStoreJson(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Session expired or invalid' } },
      { status: 401 },
    );
  }
  return null;
}
