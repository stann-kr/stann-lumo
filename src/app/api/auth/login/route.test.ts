import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getEnv } from '@/lib/db';
import { buildSessionCookieHeader, createSession, pruneExpiredSessions } from '@/capabilities/auth/auth.server';
import { POST } from './route';

const SessionStorageUnavailableError = vi.hoisted(
  () => class SessionStorageUnavailableError extends Error {},
);

vi.mock('@/lib/db', () => ({ getEnv: vi.fn() }));
vi.mock('@/capabilities/auth/auth.server', () => ({
  createSession: vi.fn(),
  buildSessionCookieHeader: vi.fn(),
  pruneExpiredSessions: vi.fn(),
  SessionStorageUnavailableError,
}));

function loginRequest(body: unknown = { password: 'test-password' }) {
  return new NextRequest('http://localhost:3004/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
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
