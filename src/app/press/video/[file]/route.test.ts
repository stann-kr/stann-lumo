import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getR2, type R2Bucket, type R2GetOptions } from '@/lib/db';
import { GET, HEAD } from './route';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/db', () => ({ getR2: vi.fn() }));

const bytes = new TextEncoder().encode('0123456789');
const file = 'stann-lumo-faust-1.mp4';
const stored = new Map([[`press/video/${file}`, bytes], ['press/video/private.mp4', bytes], [`gallery/${file}`, bytes]]);
const meta = (key: string) => ({ key, size: stored.get(key)!.length, httpEtag: '"v1"', httpMetadata: { contentType: 'video/mp4' } });

const bucket: R2Bucket = {
  async head(key) { return stored.has(key) ? meta(key) : null; },
  async get(key, options?: R2GetOptions) {
    const data = stored.get(key);
    if (!data) return null;
    const slice = options?.range ? data.slice(options.range.offset, options.range.offset + options.range.length) : data;
    return { ...meta(key), body: new Response(slice).body!, arrayBuffer: async () => slice.buffer, text: async () => '', blob: async () => new Blob([slice]) };
  },
  async put() { throw new Error('not used'); },
  async delete() { throw new Error('not used'); },
};

const call = (handler: typeof GET, name: string, headers: Record<string, string> = {}) =>
  handler(new NextRequest(`https://lumo.test/press/video/${encodeURIComponent(name)}`, { headers }), { params: Promise.resolve({ file: name }) });

describe('/press/video/[file]', () => {
  beforeEach(() => vi.mocked(getR2).mockReturnValue(bucket));

  it('downloads a listed clip from press/video as an attachment', async () => {
    const response = await call(GET, file);
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Disposition')).toBe(`attachment; filename="${file}"`);
    expect(response.headers.get('Content-Type')).toBe('video/mp4');
    expect(response.headers.get('Content-Length')).toBe('10');
    expect(await response.text()).toBe('0123456789');
  });

  it('only reads files listed in the press kit, even when R2 has the key', async () => {
    for (const name of ['private.mp4', '../gallery/stann-lumo-faust-1.mp4', 'stann-lumo-faust-1.MP4']) {
      expect((await call(GET, name)).status).toBe(404);
    }
  });

  it('resumes with a byte range and answers HEAD without a body', async () => {
    const part = await call(GET, file, { range: 'bytes=4-' });
    expect(part.status).toBe(206);
    expect(part.headers.get('Content-Range')).toBe('bytes 4-9/10');
    expect(await part.text()).toBe('456789');

    const head = await call(HEAD, file);
    expect(head.status).toBe(200);
    expect(head.headers.get('Content-Length')).toBe('10');
    expect(head.body).toBeNull();

    expect((await call(GET, file, { range: 'bytes=20-' })).status).toBe(416);
  });
});
