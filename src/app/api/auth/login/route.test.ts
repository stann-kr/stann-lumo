import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getEnv, getLoginRateLimiter } from '@/lib/db';
import { buildSessionCookieHeader, createSession, pruneExpiredSessions } from '@/capabilities/auth/auth.server';
import { POST } from './route';

const SessionStorageUnavailableError = vi.hoisted(
  () => class SessionStorageUnavailableError extends Error {},
);

vi.mock('@/lib/db', () => ({ getEnv: vi.fn(), getLoginRateLimiter: vi.fn() }));
vi.mock('@/capabilities/auth/auth.server', () => ({
  createSession: vi.fn(),
  buildSessionCookieHeader: vi.fn(),
  pruneExpiredSessions: vi.fn(),
  SessionStorageUnavailableError,
}));

function loginRequest(body: unknown = { password: 'test-password' }, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost:3004/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json', ...headers },
  });
}

describe('admin login storage boundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getEnv).mockReturnValue({ ADMIN_PASSWORD: 'test-password' });
  });

  it('does not issue a cookie when the Worker D1 binding is unavailable', async () => {
    vi.mocked(createSession).mockRejectedValue(new SessionStorageUnavailableError());

    const response = await POST(loginRequest());

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: { code: 'DB_UNAVAILABLE' },
    });
    expect(buildSessionCookieHeader).not.toHaveBeenCalled();
  });

  it('rejects a missing or non-text password before comparing or creating a session', async () => {
    for (const body of [{}, { password: 1234 }, { password: '' }]) {
      const response = await POST(loginRequest(body));
      expect(response.status).toBe(400);
    }
    expect(createSession).not.toHaveBeenCalled();
  });

  it('clears expired sessions after a successful sign-in without letting cleanup block it', async () => {
    vi.mocked(createSession).mockResolvedValue('test-only-session');
    vi.mocked(buildSessionCookieHeader).mockReturnValue('admin_session=test-only-session');
    vi.mocked(pruneExpiredSessions).mockRejectedValue(new Error('test-only cleanup failure'));

    const response = await POST(loginRequest());

    expect(response.status).toBe(200);
    expect(pruneExpiredSessions).toHaveBeenCalledTimes(1);
    expect(response.headers.get('set-cookie')).toBe('admin_session=test-only-session');
  });
});

describe('admin login attempt limit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getEnv).mockReturnValue({ ADMIN_PASSWORD: 'test-password' });
  });

  it('answers 429 for an address over the limit without checking the password', async () => {
    const limit = vi.fn().mockResolvedValue({ success: false });
    vi.mocked(getLoginRateLimiter).mockReturnValue({ limit });

    const response = await POST(loginRequest(undefined, { 'cf-connecting-ip': '203.0.113.7' }));

    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('60');
    await expect(response.json()).resolves.toMatchObject({ success: false, error: { code: 'RATE_LIMITED' } });
    expect(limit).toHaveBeenCalledWith({ key: '203.0.113.7' });
    expect(createSession).not.toHaveBeenCalled();
  });

  it('counts the attempt and signs in while the address is under the limit', async () => {
    const limit = vi.fn().mockResolvedValue({ success: true });
    vi.mocked(getLoginRateLimiter).mockReturnValue({ limit });
    vi.mocked(createSession).mockResolvedValue('test-only-session');
    vi.mocked(buildSessionCookieHeader).mockReturnValue('admin_session=test-only-session');
    vi.mocked(pruneExpiredSessions).mockResolvedValue(undefined);

    const response = await POST(loginRequest());

    expect(response.status).toBe(200);
    expect(limit).toHaveBeenCalledTimes(1);
  });
});
