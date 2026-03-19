/**
 * 공개 갤러리 API
 * GET /api/gallery — 전체 사진 목록 + 레이아웃 설정 (sort_order ASC)
 */

import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import type { GalleryPhoto, GallerySettings, GalleryData } from '@/types/content';

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

interface GallerySettingsRow {
  layout_mode: string;
  columns_mobile: number;
  columns_tablet: number;
  columns_desktop: number;
  gap_size: string;
  aspect_ratio: string;
  hover_effect: string;
  caption_display: string;
  lightbox_enabled: number;
}

const DEFAULT_SETTINGS: GallerySettings = {
  layoutMode: 'masonry',
  columnsMobile: 2,
  columnsTablet: 3,
  columnsDesktop: 4,
  gapSize: 'md',
  aspectRatio: 'auto',
  hoverEffect: 'zoom',
  captionDisplay: 'overlay',
  lightboxEnabled: true,
};

export async function GET() {
  const db = getDB();
  if (!db) {
    return NextResponse.json({ success: true, data: { photos: [], settings: DEFAULT_SETTINGS } });
  }

  try {
    const [photosResult, settingsResult] = await db.batch([
      db.prepare('SELECT * FROM gallery_photos ORDER BY sort_order ASC, created_at ASC'),
      db.prepare('SELECT * FROM gallery_settings WHERE id = 1'),
    ]);

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
    }));

    const settingsRow = (settingsResult.results as GallerySettingsRow[])[0];
    const settings: GallerySettings = settingsRow
      ? {
          layoutMode: (settingsRow.layout_mode as GallerySettings['layoutMode']) ?? 'masonry',
          columnsMobile: (settingsRow.columns_mobile as GallerySettings['columnsMobile']) ?? 2,
          columnsTablet: (settingsRow.columns_tablet as GallerySettings['columnsTablet']) ?? 3,
          columnsDesktop: (settingsRow.columns_desktop as GallerySettings['columnsDesktop']) ?? 4,
          gapSize: (settingsRow.gap_size as GallerySettings['gapSize']) ?? 'md',
          aspectRatio: (settingsRow.aspect_ratio as GallerySettings['aspectRatio']) ?? 'auto',
          hoverEffect: (settingsRow.hover_effect as GallerySettings['hoverEffect']) ?? 'zoom',
          captionDisplay: (settingsRow.caption_display as GallerySettings['captionDisplay']) ?? 'overlay',
          lightboxEnabled: settingsRow.lightbox_enabled === 1,
        }
      : DEFAULT_SETTINGS;

    const data: GalleryData = { photos, settings };
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch gallery' } },
      { status: 500 },
    );
  }
}
