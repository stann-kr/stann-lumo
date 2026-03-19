/**
 * R2 미디어 프록시 서빙
 * GET /api/media/[id] — R2에서 이미지/동영상 스트리밍 (공개 엔드포인트)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getR2 } from '@/lib/db';

export async function GET(
  _request: NextRequest,
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
    const object = await r2.get(`gallery/${id}`);
    if (!object) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Media not found' } },
        { status: 404 },
      );
    }

    const contentType = object.httpMetadata?.contentType ?? 'application/octet-stream';

    // 동영상은 range request 지원을 위해 캐시 정책 분리
    const isVideo = contentType.startsWith('video/');
    const cacheControl = isVideo
      ? 'public, max-age=86400'
      : 'public, max-age=31536000, immutable';

    return new Response(object.body as ReadableStream, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': cacheControl,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch media' } },
      { status: 500 },
    );
  }
}
