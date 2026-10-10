import { afterEach, describe, expect, it, vi } from 'vitest';
import { adminLoginHref, adminReturnPath, getAdminSessionState } from './auth.client';

describe('admin return path', () => {
  it.each([
    ['/admin/music', '/admin/music'],
    ['/admin/archive?sort=oldest', '/admin/archive?sort=oldest'],
    [null, '/admin/events'],
    ['/admin', '/admin/events'],
    ['/events', '/admin/events'],
    ['https://evil.example/admin/music', '/admin/events'],
    ['//evil.example/admin/music', '/admin/events'],
    ['/admin/../events', '/admin/events'],
    ['/admin/\\evil.example', '/admin/events'],
  ])('keeps %s inside the admin as %s', (value, expected) => {
    expect(adminReturnPath(value)).toBe(expected);
  });

  it('only carries a return path that differs from the default landing page', () => {
    expect(adminLoginHref('/admin/contact')).toBe('/admin?next=%2Fadmin%2Fcontact');
    expect(adminLoginHref('/admin/events')).toBe('/admin');
  });
});

describe('getAdminSessionState', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('separates an explicit sign-out from a request that never got an answer', async () => {
    const respond = (body: unknown, status = 200) => vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status })));

    respond({ success: true, data: { authenticated: true } });
    await expect(getAdminSessionState()).resolves.toBe('authenticated');
    respond({ success: false, data: { authenticated: false } });
    await expect(getAdminSessionState()).resolves.toBe('unauthenticated');
    respond({ success: false }, 500);
    await expect(getAdminSessionState()).resolves.toBe('unknown');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    await expect(getAdminSessionState()).resolves.toBe('unknown');
  });
});
