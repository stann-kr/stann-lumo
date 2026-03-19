/**
 * 갤러리 레이아웃 설정 어드민 API
 * GET /api/admin/gallery-settings — 현재 설정 조회
 * PUT /api/admin/gallery-settings — 설정 업데이트
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { requireAdminSession } from '@/lib/adminAuth';
import type { GallerySettings } from '@/types/content';

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

function rowToSettings(row: GallerySettingsRow): GallerySettings {
  return {
    layoutMode: (row.layout_mode as GallerySettings['layoutMode']) ?? 'masonry',
    columnsMobile: (row.columns_mobile as GallerySettings['columnsMobile']) ?? 2,
    columnsTablet: (row.columns_tablet as GallerySettings['columnsTablet']) ?? 3,
    columnsDesktop: (row.columns_desktop as GallerySettings['columnsDesktop']) ?? 4,
    gapSize: (row.gap_size as GallerySettings['gapSize']) ?? 'md',
    aspectRatio: (row.aspect_ratio as GallerySettings['aspectRatio']) ?? 'auto',
    hoverEffect: (row.hover_effect as GallerySettings['hoverEffect']) ?? 'zoom',
    captionDisplay: (row.caption_display as GallerySettings['captionDisplay']) ?? 'overlay',
    lightboxEnabled: row.lightbox_enabled === 1,
  };
}

export async function GET(request: NextRequest) {
  const authError = await requireAdminSession(request);
  if (authError) return authError;

  const db = getDB();
  if (!db) {
    return NextResponse.json({ success: true, data: DEFAULT_SETTINGS });
  }

  try {
    const row = await db
      .prepare('SELECT * FROM gallery_settings WHERE id = 1')
      .first<GallerySettingsRow>();

    return NextResponse.json({ success: true, data: row ? rowToSettings(row) : DEFAULT_SETTINGS });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch settings' } },
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
    const body = (await request.json()) as { settings: GallerySettings };
    const { settings } = body;

    if (!settings) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'settings is required' } },
        { status: 400 },
      );
    }

    await db
      .prepare(
        `INSERT INTO gallery_settings
          (id, layout_mode, columns_mobile, columns_tablet, columns_desktop,
           gap_size, aspect_ratio, hover_effect, caption_display, lightbox_enabled)
         VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           layout_mode     = excluded.layout_mode,
           columns_mobile  = excluded.columns_mobile,
           columns_tablet  = excluded.columns_tablet,
           columns_desktop = excluded.columns_desktop,
           gap_size        = excluded.gap_size,
           aspect_ratio    = excluded.aspect_ratio,
           hover_effect    = excluded.hover_effect,
           caption_display = excluded.caption_display,
           lightbox_enabled = excluded.lightbox_enabled`,
      )
      .bind(
        settings.layoutMode,
        settings.columnsMobile,
        settings.columnsTablet,
        settings.columnsDesktop,
        settings.gapSize,
        settings.aspectRatio,
        settings.hoverEffect,
        settings.captionDisplay,
        settings.lightboxEnabled ? 1 : 0,
      )
      .run();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update settings' } },
      { status: 500 },
    );
  }
}
