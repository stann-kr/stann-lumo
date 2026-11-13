import { afterEach, describe, expect, it, vi } from 'vitest';
import { ADMIN_UNAUTHORIZED_EVENT } from '@/capabilities/auth/adminSessionEvents';
import { apiRequest } from './apiClient';

describe('apiRequest', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    ['HTTP 오류', new Response(JSON.stringify({ success: true }), { status: 500 }), 'HTTP_ERROR'],
    ['손상된 JSON', new Response('not json', { status: 200 }), 'INVALID_JSON'],
  ])('treats %s as a failed response', async (_caseName, response, code) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));

    const result = await apiRequest('/api/admin/test');

    expect(result).toMatchObject({ success: false, error: { code } });
  });

  it('keeps the reason a failed response gives, and falls back to the status when there is none', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: false, error: { code: 'INVALID_URL', message: 'Invalid YouTube URL' } }), { status: 400 })));
    await expect(apiRequest('/api/admin/archive/youtube')).resolves.toEqual({ success: false, error: { code: 'HTTP_ERROR', message: 'Invalid YouTube URL' } });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>bad gateway</html>', { status: 502 })));
    await expect(apiRequest('/api/admin/archive/youtube')).resolves.toEqual({ success: false, error: { code: 'HTTP_ERROR', message: 'Request failed with status 502' } });
  });

  it('marks a 409 as a conflict so the screen can offer a reload, and keeps its reason', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: false, error: { code: 'CONFLICT', message: 'Tracks changed. Refresh and try again.' } }), { status: 409 })));
    await expect(apiRequest('/api/admin/tracks', { method: 'PUT' })).resolves.toEqual({ success: false, error: { code: 'CONFLICT', message: 'Tracks changed. Refresh and try again.' } });
  });

  it('treats network errors and failed JSON envelopes as failures', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    await expect(apiRequest('/api/admin/test')).resolves.toMatchObject({
      success: false,
      error: { code: 'NETWORK_ERROR' },
    });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      success: false,
      error: { code: 'DB_UNAVAILABLE', message: 'unavailable' },
    }), { status: 200 })));
    await expect(apiRequest('/api/admin/test')).resolves.toMatchObject({
      success: false,
      error: { code: 'DB_UNAVAILABLE' },
    });
  });

  it('announces an admin 401 so the shell can re-check the session, but not other failures', async () => {
    const browserWindow = new EventTarget();
    const listener = vi.fn();
    browserWindow.addEventListener(ADMIN_UNAUTHORIZED_EVENT, listener);
    vi.stubGlobal('window', browserWindow);

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 401 })));
    await apiRequest('/api/admin/tracks', { method: 'PUT', body: '{}' });
    expect(listener).toHaveBeenCalledTimes(1);

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 500 })));
    await apiRequest('/api/admin/tracks');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 401 })));
    await apiRequest('/api/auth/login', { method: 'POST', body: '{}' });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('does not set a JSON Content-Type for FormData uploads', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await apiRequest('/api/admin/archive/upload', {
      method: 'POST',
      body: new FormData(),
    });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(new Headers(init.headers).has('Content-Type')).toBe(false);
  });
});
