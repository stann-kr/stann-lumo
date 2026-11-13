import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getImages, getR2, type ImagesBinding, type R2Bucket, type R2GetOptions } from '@/lib/db';
import { GET } from './route';

vi.mock('server-only', () => ({}));
vi.mock('@/lib/db', () => ({ getR2: vi.fn(), getImages: vi.fn() }));

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

describe('GET /api/media/[id] with a width', () => {
  const photo = { key: 'gallery/photo', size: bytes.length, httpEtag: '"p1"', httpMetadata: { contentType: 'image/jpeg' } };
  const photos: R2Bucket = {
    ...bucket,
    async head(key) { return key === photo.key ? photo : null; },
    async get(key) { return key === photo.key ? { ...photo, body: new Response(bytes).body!, arrayBuffer: async () => bytes.buffer, text: async () => '', blob: async () => new Blob([bytes]) } : null; },
  };
  const transform = vi.fn();
  const images = (fail = false): ImagesBinding => ({
    input: (stream) => ({
      transform: (options) => {
        transform(options);
        return { output: async () => { if (fail) throw new Error('9422'); await new Response(stream).arrayBuffer(); return { response: () => new Response('webp', { headers: { 'content-type': 'image/webp' } }) }; } };
      },
    }),
  });
  const fetchPhoto = (query: string) => GET(new NextRequest(`https://lumo.test/api/media/photo?v=2${query}`), { params: Promise.resolve({ id: 'photo' }) });

  beforeEach(() => { vi.mocked(getR2).mockReturnValue(photos); transform.mockClear(); });

  it('serves a scaled-down WebP for an allowed width', async () => {
    vi.mocked(getImages).mockReturnValue(images());
    const response = await fetchPhoto('&w=640');
    expect(transform).toHaveBeenCalledWith({ width: 640, fit: 'scale-down' });
    expect(response.headers.get('Content-Type')).toBe('image/webp');
    expect(await response.text()).toBe('webp');
  });

  it('serves the original when the width is not offered, the binding is missing, or the transformation fails', async () => {
    vi.mocked(getImages).mockReturnValue(images());
    expect(await (await fetchPhoto('&w=123')).text()).toBe('0123456789');
    expect(transform).not.toHaveBeenCalled();

    vi.mocked(getImages).mockReturnValue(undefined);
    expect(await (await fetchPhoto('&w=640')).text()).toBe('0123456789');

    vi.mocked(getImages).mockReturnValue(images(true));
    const fallback = await fetchPhoto('&w=640');
    expect(fallback.headers.get('Content-Type')).toBe('image/jpeg');
    expect(await fallback.text()).toBe('0123456789');
  });
});

describe('GET /api/media/[id] resize cache', () => {
  const key = 'gallery/still';
  let stored: { bytes: Uint8Array; etag: string; contentType: string } | null = null;
  const describeStored = () => stored && { key, size: stored.bytes.length, httpEtag: stored.etag, httpMetadata: { contentType: stored.contentType } };
  const still: R2Bucket = {
    ...bucket,
    async head(name) { return name === key ? describeStored() : null; },
    async get(name) {
      const object = name === key ? describeStored() : null;
      if (!object || !stored) return null;
      const content = stored.bytes;
      return { ...object, body: new Response(content).body!, arrayBuffer: async () => content.buffer as ArrayBuffer, text: async () => '', blob: async () => new Blob([content]) };
    },
  };
  const transform = vi.fn();
  const images: ImagesBinding = {
    input: (stream) => ({
      transform: (options) => {
        transform(options);
        return { output: async () => { const source = await new Response(stream).text(); return { response: () => new Response(`webp:${source}`, { headers: { 'content-type': 'image/webp' } }) }; } };
      },
    }),
  };
  /** Workers' per-data-centre cache: it keeps whatever was put until it expires, whatever happens in R2. */
  const edge = new Map<string, Response>();
  const store = (content: string, etag: string, contentType = 'image/jpeg') => { stored = { bytes: new TextEncoder().encode(content), etag, contentType }; };
  const fetchStill = () => GET(new NextRequest('https://lumo.test/api/media/still?v=2&w=640'), { params: Promise.resolve({ id: 'still' }) });

  beforeEach(() => {
    edge.clear();
    transform.mockClear();
    vi.stubGlobal('caches', { default: {
      async match(url: string) { return edge.get(url)?.clone(); },
      async put(url: string, response: Response) { edge.set(url, response.clone()); },
    } });
    vi.mocked(getR2).mockReturnValue(still);
    vi.mocked(getImages).mockReturnValue(images);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('reuses a cached resize but stops serving it once the object is deleted', async () => {
    store('first', '"a"');
    expect(await (await fetchStill()).text()).toBe('webp:first');
    const cached = await fetchStill();
    expect(cached.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable');
    expect(await cached.text()).toBe('webp:first');
    expect(transform).toHaveBeenCalledOnce();

    stored = null;
    expect((await fetchStill()).status).toBe(404);
  });

  it('never answers a replaced object with the resize of its previous version', async () => {
    store('first', '"a"');
    expect(await (await fetchStill()).text()).toBe('webp:first');

    store('second', '"b"');
    expect(await (await fetchStill()).text()).toBe('webp:second');
    expect(transform).toHaveBeenCalledTimes(2);
  });

  it('serves media the transformer cannot scale as uploaded, without a resize attempt', async () => {
    store('gif', '"g"', 'image/gif');
    const response = await fetchStill();
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/gif');
    expect(transform).not.toHaveBeenCalled();
    expect(await response.text()).toBe('gif');
  });
});
