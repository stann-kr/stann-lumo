/**
 * YouTube 동영상 갤러리 추가
 * POST /api/admin/gallery/youtube
 * Body: { youtubeUrl: string, caption?: string, altText?: string }
 * R2 저장 없음 — D1 메타데이터만 INSERT
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { requireAdminSession } from '@/lib/adminAuth';
import type { GalleryPhoto } from '@/types/content';

/**
 * YouTube URL에서 video ID 추출
 * 지원 형식: youtu.be/{id}, watch?v={id}, shorts/{id}, embed/{id}
 */
function extractYoutubeId(url: string): string | null {
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

export async function POST(request: NextRequest) {
  const authError = await requireAdminSession(request);
  if (authError) return authError;

  const db = getDB();
  if (!db) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_UNAVAILABLE', message: 'Database not available' } },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as {
      youtubeUrl: string;
      caption?: string;
      altText?: string;
      linkedEventId?: string;
    };

    if (!body.youtubeUrl) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'youtubeUrl is required' } },
        { status: 400 },
      );
    }

    const videoId = extractYoutubeId(body.youtubeUrl);
    if (!videoId) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_URL', message: 'Invalid YouTube URL' } },
        { status: 400 },
      );
    }

    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    // 현재 최대 sort_order 조회
    const maxOrderRow = await db
      .prepare('SELECT MAX(sort_order) as max_order FROM gallery_photos')
      .first<{ max_order: number | null }>();
    const nextOrder = (maxOrderRow?.max_order ?? -1) + 1;

    const id = crypto.randomUUID();
    const caption = body.caption ?? '';
    const altText = body.altText ?? `YouTube: ${videoId}`;
    const linkedEventId = body.linkedEventId ?? null;

    await db
      .prepare(
        `INSERT INTO gallery_photos
          (id, filename, mime_type, size_bytes, alt_text, caption, sort_order,
           media_type, focal_x, focal_y, video_youtube_id, video_thumbnail_url, linked_event_id)
         VALUES (?, ?, 'video/youtube', 0, ?, ?, ?, 'video_youtube', 50, 50, ?, ?, ?)`,
      )
      .bind(id, `youtube_${videoId}`, altText, caption, nextOrder, videoId, thumbnailUrl, linkedEventId)
      .run();

    const photo: GalleryPhoto = {
      id,
      filename: `youtube_${videoId}`,
      mimeType: 'video/youtube',
      sizeBytes: 0,
      altText,
      caption,
      sortOrder: nextOrder,
      createdAt: new Date().toISOString(),
      mediaType: 'video_youtube',
      focalX: 50,
      focalY: 50,
      videoYoutubeId: videoId,
      videoThumbnailUrl: thumbnailUrl,
      ...(linkedEventId && { linkedEventId }),
    };

    return NextResponse.json({ success: true, data: photo });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to add YouTube video' } },
      { status: 500 },
    );
  }
}
