/**
 * 공개 이벤트 상세 API
 * GET /api/events/{id} — 단일 공연 정보 + 포스터 이미지
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import type { Performance, GalleryPhoto } from '@/types/content';

interface PerformanceRow {
  id: string;
  date: string;
  venue: string;
  location: string | null;
  time: string | null;
  title: string;
  lineup: string | null;
  ra_event_link: string | null;
  ra_event_id: string | null;
  poster_image_id: string | null;
  status: string;
  sort_order: number;
}

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

export interface EventDetailData {
  event: Performance;
  posterPhoto?: GalleryPhoto;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const db = getDB();

  if (!db) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_UNAVAILABLE', message: 'Database not available' } },
      { status: 503 },
    );
  }

  try {
    const perfRow = await db
      .prepare('SELECT * FROM performances WHERE id = ?')
      .bind(id)
      .first<PerformanceRow>();

    if (!perfRow) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Event not found' } },
        { status: 404 },
      );
    }

    const event: Performance = {
      id: perfRow.id,
      date: perfRow.date,
      venue: perfRow.venue,
      title: perfRow.title,
      status: perfRow.status as Performance['status'],
      ...(perfRow.location      != null && { location:      perfRow.location }),
      ...(perfRow.time          != null && { time:          perfRow.time }),
      ...(perfRow.lineup        != null && { lineup:        perfRow.lineup }),
      ...(perfRow.ra_event_link != null && { raEventLink:   perfRow.ra_event_link }),
      ...(perfRow.ra_event_id   != null && { raEventId:     perfRow.ra_event_id }),
      ...(perfRow.poster_image_id != null && { posterImageId: perfRow.poster_image_id }),
    };

    let posterPhoto: GalleryPhoto | undefined;
    if (perfRow.poster_image_id) {
      const photoRow = await db
        .prepare('SELECT * FROM gallery_photos WHERE id = ?')
        .bind(perfRow.poster_image_id)
        .first<GalleryPhotoRow>();

      if (photoRow) {
        posterPhoto = {
          id: photoRow.id,
          filename: photoRow.filename,
          mimeType: photoRow.mime_type,
          sizeBytes: photoRow.size_bytes,
          altText: photoRow.alt_text,
          caption: photoRow.caption,
          sortOrder: photoRow.sort_order,
          createdAt: photoRow.created_at,
          mediaType: (photoRow.media_type as GalleryPhoto['mediaType']) ?? 'image',
          focalX: photoRow.focal_x ?? 50,
          focalY: photoRow.focal_y ?? 50,
          ...(photoRow.video_youtube_id  != null && { videoYoutubeId:     photoRow.video_youtube_id }),
          ...(photoRow.video_thumbnail_url != null && { videoThumbnailUrl: photoRow.video_thumbnail_url }),
          ...(photoRow.linked_event_id   != null && { linkedEventId:      photoRow.linked_event_id }),
        };
      }
    }

    const data: EventDetailData = { event, ...(posterPhoto && { posterPhoto }) };
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch event' } },
      { status: 500 },
    );
  }
}
