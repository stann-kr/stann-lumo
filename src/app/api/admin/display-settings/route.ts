/**
 * 어드민 Display Settings API
 *
 * GET  /api/admin/display-settings?page=events  → 해당 페이지 설정 JSON
 * GET  /api/admin/display-settings               → 전체 7페이지 설정 맵
 * PUT  /api/admin/display-settings               → body: { page: 'events', settings: {...} }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { requireAdminSession } from '@/lib/adminAuth';
import { DISPLAY_SETTINGS_DEFAULTS } from '@/types/displaySettings';
import type { AllDisplaySettings } from '@/types/displaySettings';

const VALID_PAGES = ['global', 'home', 'about', 'music', 'events', 'contact', 'link'] as const;
type PageKey = typeof VALID_PAGES[number];

interface DisplaySettingsRow {
  page: string;
  settings: string;
}

/** DB 행 → 설정 객체 (기본값과 shallow merge) */
function mergeWithDefaults<K extends PageKey>(page: K, raw: string): AllDisplaySettings[K] {
  try {
    const parsed = JSON.parse(raw) as Partial<AllDisplaySettings[K]>;
    return { ...DISPLAY_SETTINGS_DEFAULTS[page], ...parsed };
  } catch {
    return DISPLAY_SETTINGS_DEFAULTS[page];
  }
}

export async function GET(request: NextRequest) {
  const authResponse = await requireAdminSession(request);
  if (authResponse) return authResponse;

  const db = getDB();
  if (!db) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_UNAVAILABLE', message: 'Database not available' } },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const page = searchParams.get('page') as PageKey | null;

  try {
    if (page) {
      // 단일 페이지 조회
      if (!VALID_PAGES.includes(page)) {
        return NextResponse.json(
          { success: false, error: { code: 'BAD_REQUEST', message: `page must be one of: ${VALID_PAGES.join(', ')}` } },
          { status: 400 },
        );
      }
      const result = await db
        .prepare('SELECT * FROM display_settings WHERE page = ?')
        .bind(page)
        .first<DisplaySettingsRow>();

      const settings = mergeWithDefaults(page, result?.settings ?? '{}');
      return NextResponse.json({ success: true, data: settings });
    }

    // 전체 페이지 조회
    const rows = await db
      .prepare('SELECT * FROM display_settings')
      .all<DisplaySettingsRow>();

    const rowMap = Object.fromEntries(
      (rows.results ?? []).map((r) => [r.page, r.settings]),
    );

    const data: AllDisplaySettings = {
      global:  mergeWithDefaults('global',  rowMap.global  ?? '{}'),
      home:    mergeWithDefaults('home',    rowMap.home    ?? '{}'),
      about:   mergeWithDefaults('about',   rowMap.about   ?? '{}'),
      music:   mergeWithDefaults('music',   rowMap.music   ?? '{}'),
      events:  mergeWithDefaults('events',  rowMap.events  ?? '{}'),
      contact: mergeWithDefaults('contact', rowMap.contact ?? '{}'),
      link:    mergeWithDefaults('link',    rowMap.link    ?? '{}'),
    };

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch display settings' } },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const authResponse = await requireAdminSession(request);
  if (authResponse) return authResponse;

  const db = getDB();
  if (!db) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_UNAVAILABLE', message: 'Database not available' } },
      { status: 503 },
    );
  }

  try {
    const body = await request.json() as { page: PageKey; settings: Record<string, unknown> };
    const { page, settings } = body;

    if (!page || !VALID_PAGES.includes(page)) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: `page must be one of: ${VALID_PAGES.join(', ')}` } },
        { status: 400 },
      );
    }

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'settings must be an object' } },
        { status: 400 },
      );
    }

    await db
      .prepare(
        'INSERT INTO display_settings (page, settings) VALUES (?, ?) ON CONFLICT(page) DO UPDATE SET settings = excluded.settings',
      )
      .bind(page, JSON.stringify(settings))
      .run();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update display settings' } },
      { status: 500 },
    );
  }
}
