/**
 * 공개 갤러리 API
 * GET /api/archive — 전체 사진 목록 (sort_order ASC)
 */

import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import type { GalleryPhoto, GalleryData } from '@/types/content';

interface GalleryPhotoRow {
  id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  alt_text: string;
  caption: string;
  sort_order: number;
  created_at: string;
  media_type: string;
  focal_x: number;
  focal_y: number;
  video_youtube_id: string | null;
  video_thumbnail_url: string | null;
  linked_event_id: string | null;
}

export async function GET() {
  const db = getDB();
  if (!db) {
    return NextResponse.json({ success: true, data: { photos: [] } });
  }

  try {
    const photosResult = await db
      .prepare('SELECT * FROM gallery_photos ORDER BY sort_order ASC, created_at DESC')
      .all();

    const photos: GalleryPhoto[] = (photosResult.results as GalleryPhotoRow[]).map((r) => ({
      id: r.id,
      filename: r.filename,
      mimeType: r.mime_type,
      sizeBytes: r.size_bytes,
      altText: r.alt_text,
      caption: r.caption,
      sortOrder: r.sort_order,
      createdAt: r.created_at,
      mediaType: (r.media_type as GalleryPhoto['mediaType']) ?? 'image',
      focalX: r.focal_x ?? 50,
      focalY: r.focal_y ?? 50,
      videoYoutubeId: r.video_youtube_id ?? undefined,
      videoThumbnailUrl: r.video_thumbnail_url ?? undefined,
      linkedEventId: r.linked_event_id ?? undefined,
    }));

    const data: GalleryData = { photos };
    return NextResponse.json({ success: true, data }, {
      headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch archive' } },
      { status: 500 },
    );
  }
}
