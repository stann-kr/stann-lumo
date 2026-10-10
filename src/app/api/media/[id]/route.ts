import { NextRequest, NextResponse } from 'next/server';
import { fetchGalleryObject, headGalleryObject, resolveByteRange } from '@/capabilities/media/mediaRepository.server';
import { getR2, type R2Object, type R2ObjectBody } from '@/lib/db';

function notFound() {
  return NextResponse.json(
    { success: false, error: { code: 'NOT_FOUND', message: 'Media not found' } },
    { status: 404 },
  );
}

function hasBody(object: R2Object | R2ObjectBody): object is R2ObjectBody {
  return 'body' in object && Boolean(object.body);
}

function mediaHeaders(object: R2Object): Headers {
  const contentType = object.httpMetadata?.contentType ?? 'application/octet-stream';
  const headers = new Headers({
    'Content-Type': contentType,
    'Cache-Control': contentType.startsWith('video/') ? 'public, max-age=86400' : 'public, max-age=31536000, immutable',
    'Accept-Ranges': 'bytes',
  });
  if (object.httpEtag) headers.set('ETag', object.httpEtag);
  return headers;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const r2 = getR2();
  if (!r2) {
    return NextResponse.json(
      { success: false, error: { code: 'R2_UNAVAILABLE', message: 'Media storage not available' } },
      { status: 503 },
    );
  }

  try {
    const rangeHeader = request.headers.get('range');
    if (rangeHeader) {
      const head = await headGalleryObject(r2, id);
      if (!head) return notFound();
      const range = resolveByteRange(rangeHeader, head.size);
      if (range === 'unsatisfiable') {
        return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${head.size}`, 'Accept-Ranges': 'bytes' } });
      }
      if (range) {
        const length = range.end - range.start + 1;
        const part = await fetchGalleryObject(r2, id, { range: { offset: range.start, length } });
        if (!part || !hasBody(part)) return notFound();
        const headers = mediaHeaders(part);
        headers.set('Content-Range', `bytes ${range.start}-${range.end}/${head.size}`);
        headers.set('Content-Length', String(length));
        return new Response(part.body, { status: 206, headers });
      }
    }

    const ifNoneMatch = request.headers.get('if-none-match');
    const object = await fetchGalleryObject(r2, id, ifNoneMatch ? { onlyIf: new Headers({ 'if-none-match': ifNoneMatch }) } : undefined);
    if (!object) return notFound();
    // R2 answers an unmet If-None-Match with the metadata only.
    if (!hasBody(object)) return new Response(null, { status: 304, headers: mediaHeaders(object) });
    return new Response(object.body, { headers: mediaHeaders(object) });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch media' } },
      { status: 500 },
    );
  }
}
