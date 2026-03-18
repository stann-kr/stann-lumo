/**
 * 어드민 테마 색상 API
 * GET  /api/admin/theme   — 테마 색상 조회 (lang 무관)
 * PUT  /api/admin/theme   — 테마 색상 업데이트
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { requireAdminSession } from '@/lib/adminAuth';
import type { ThemeColors } from '@/types/content';

interface ThemeColorsRow {
  id: number; primary: string; secondary: string; accent: string;
  muted: string; bg: string; bg_sidebar: string;
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
    const result = await db.prepare(
      'SELECT * FROM theme_colors WHERE id = 1',
    ).first<ThemeColorsRow>();

    if (!result) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Theme colors not found' } },
        { status: 404 },
      );
    }

    const data: ThemeColors = {
      primary:   result.primary,
      secondary: result.secondary,
      accent:    result.accent,
      muted:     result.muted,
      bg:        result.bg,
      bgSidebar: result.bg_sidebar,
    };

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch theme colors' } },
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
    const body = (await request.json()) as { themeColors: ThemeColors };
    const { themeColors } = body;

    if (!themeColors || typeof themeColors !== 'object') {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'themeColors is required' } },
        { status: 400 },
      );
    }

    await db.prepare(
      `UPDATE theme_colors
       SET "primary" = ?, secondary = ?, accent = ?, muted = ?, bg = ?, bg_sidebar = ?
       WHERE id = 1`,
    ).bind(
      themeColors.primary,
      themeColors.secondary,
      themeColors.accent,
      themeColors.muted,
      themeColors.bg,
      themeColors.bgSidebar,
    ).run();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update theme colors' } },
      { status: 500 },
    );
  }
}
