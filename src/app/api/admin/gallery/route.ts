/**
 * 어드민 갤러리 API
 * GET /api/admin/gallery — 전체 목록 조회
 * PUT /api/admin/gallery — 사진 메타(caption/altText/sortOrder/focalX/focalY) 일괄 업데이트
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { requireAdminSession } from '@/lib/adminAuth';
import type { GalleryPhoto } from '@/types/content';

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
}

export async function GET(request: NextRequest) {
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
    const result = await db
      .prepare('SELECT * FROM gallery_photos ORDER BY sort_order ASC, created_at ASC')
      .all<GalleryPhotoRow>();

    const data: GalleryPhoto[] = result.results.map((r) => ({
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
    }));

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch gallery' } },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
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
    const body = (await request.json()) as { photos: GalleryPhoto[] };
    const { photos } = body;

    if (!Array.isArray(photos)) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'photos must be an array' } },
        { status: 400 },
      );
    }

    await db.batch(
      photos.map((p, idx) =>
        db
          .prepare(
            `UPDATE gallery_photos
             SET alt_text = ?, caption = ?, sort_order = ?, focal_x = ?, focal_y = ?
             WHERE id = ?`,
          )
          .bind(p.altText ?? '', p.caption ?? '', idx, p.focalX ?? 50, p.focalY ?? 50, p.id),
      ),
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update gallery' } },
      { status: 500 },
    );
  }
}
