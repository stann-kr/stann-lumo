import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getR2, type R2Bucket, type R2GetOptions } from '@/lib/db';
import { GET } from './route';

vi.mock('@/lib/db', () => ({ getR2: vi.fn() }));

const bytes = new TextEncoder().encode('0123456789');
const meta = { key: 'gallery/clip', size: bytes.length, httpEtag: '"v1"', httpMetadata: { contentType: 'video/mp4' } };

/** Minimal R2 double: honours range reads and If-None-Match the way the Workers binding does. */
const bucket: R2Bucket = {
  async head(key) { return key === meta.key ? meta : null; },
  async get(key, options?: R2GetOptions) {
    if (key !== meta.key) return null;
    if (options?.onlyIf?.get('if-none-match') === meta.httpEtag) return meta;
    const slice = options?.range ? bytes.slice(options.range.offset, options.range.offset + options.range.length) : bytes;
    return { ...meta, body: new Response(slice).body!, arrayBuffer: async () => slice.buffer, text: async () => '', blob: async () => new Blob([slice]) };
  },
  async put() { throw new Error('not used'); },
  async delete() { throw new Error('not used'); },
};

function request(headers: Record<string, string> = {}, id = 'clip') {
  return GET(new NextRequest(`https://lumo.test/api/media/${id}`, { headers }), { params: Promise.resolve({ id }) });
}

describe('GET /api/media/[id]', () => {
  beforeEach(() => vi.mocked(getR2).mockReturnValue(bucket));

  it('advertises byte ranges and an ETag on a full response', async () => {
    const response = await request();

    expect(response.status).toBe(200);
    expect(response.headers.get('Accept-Ranges')).toBe('bytes');
    expect(response.headers.get('ETag')).toBe('"v1"');
    expect(await response.text()).toBe('0123456789');
  });

  it.each([
    ['bytes=0-1', 'bytes 0-1/10', '01'],
    ['bytes=7-', 'bytes 7-9/10', '789'],
    ['bytes=-3', 'bytes 7-9/10', '789'],
    ['bytes=8-99', 'bytes 8-9/10', '89'],
  ])('serves %s as a partial response', async (range, contentRange, body) => {
    const response = await request({ range });

    expect(response.status).toBe(206);
    expect(response.headers.get('Content-Range')).toBe(contentRange);
    expect(await response.text()).toBe(body);
  });

  it('rejects a range past the end and revalidates an unchanged object', async () => {
    const outOfRange = await request({ range: 'bytes=10-' });
    expect(outOfRange.status).toBe(416);
    expect(outOfRange.headers.get('Content-Range')).toBe('bytes */10');

    const unchanged = await request({ 'if-none-match': '"v1"' });
    expect(unchanged.status).toBe(304);
    expect(await unchanged.text()).toBe('');
  });

  it('answers 404 for unknown media, with or without a range', async () => {
    expect((await request({}, 'missing')).status).toBe(404);
    expect((await request({ range: 'bytes=0-1' }, 'missing')).status).toBe(404);
  });
});
