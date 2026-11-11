import { NextRequest } from 'next/server';
import { PRESS_VIDEO_FILES } from '@/capabilities/presskit/pressKit';
import { resolveByteRange } from '@/capabilities/media/mediaRepository.server';
import { getR2, type R2Object, type R2ObjectBody } from '@/lib/db';

/**
 * Press kit performance clips. Only the files listed in PRESS_VIDEOS are read, from R2 `press/video/<file>`,
 * and always as an attachment. Ranges let download managers resume the larger clips.
 */

const notFound = () => new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });

function headers(file: string, object: R2Object): Headers {
  const result = new Headers({
    'Content-Type': 'video/mp4',
    'Content-Disposition': `attachment; filename="${file}"`,
    'Cache-Control': 'public, max-age=86400',
    'Accept-Ranges': 'bytes',
    'X-Content-Type-Options': 'nosniff',
  });
  if (object.httpEtag) result.set('ETag', object.httpEtag);
  return result;
}

const hasBody = (object: R2Object | R2ObjectBody): object is R2ObjectBody => 'body' in object && Boolean(object.body);

async function serve(request: NextRequest, file: string, withBody: boolean): Promise<Response> {
  if (!PRESS_VIDEO_FILES.has(file)) return notFound();
  const r2 = getR2();
  if (!r2) return new Response('Media storage not available', { status: 503 });
  const key = `press/video/${file}`;
  try {
    const head = await r2.head(key);
    if (!head) return notFound();
    const range = resolveByteRange(request.headers.get('range'), head.size);
    if (range === 'unsatisfiable') {
      return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${head.size}`, 'Accept-Ranges': 'bytes' } });
    }
    const start = range?.start ?? 0;
    const length = range ? range.end - range.start + 1 : head.size;
    const responseHeaders = headers(file, head);
    responseHeaders.set('Content-Length', String(length));
    if (range) responseHeaders.set('Content-Range', `bytes ${range.start}-${range.end}/${head.size}`);
    const status = range ? 206 : 200;
    if (!withBody) return new Response(null, { status, headers: responseHeaders });
    const object = await r2.get(key, range ? { range: { offset: start, length } } : undefined);
    if (!object || !hasBody(object)) return notFound();
    return new Response(object.body, { status, headers: responseHeaders });
  } catch {
    return new Response('Failed to fetch video', { status: 500 });
  }
}

type Context = { params: Promise<{ file: string }> };

export async function GET(request: NextRequest, { params }: Context) {
  return serve(request, (await params).file, true);
}

export async function HEAD(request: NextRequest, { params }: Context) {
  return serve(request, (await params).file, false);
}
