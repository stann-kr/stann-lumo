/**
 * 어드민 링크 플랫폼 API
 * GET  /api/admin/link-platforms?lang=en|ko
 * PUT  /api/admin/link-platforms
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { requireAdminSession } from '@/lib/adminAuth';
import type { LinkPlatform } from '@/types/content';

interface LinkPlatformRow {
  id: string; lang: string; platform: string; url: string; icon: string; description: string; sort_order: number;
}

export async function GET(request: NextRequest) {
  const authError = await requireAdminSession(request);
  if (authError) return authError;

  const lang = request.nextUrl.searchParams.get('lang') ?? 'en';
  if (lang !== 'en' && lang !== 'ko') {
    return NextResponse.json(
      { success: false, error: { code: 'BAD_REQUEST', message: 'lang must be "en" or "ko"' } },
      { status: 400 },
    );
  }

  const db = getDB();
  if (!db) {
    return NextResponse.json(
      { success: false, error: { code: 'DB_UNAVAILABLE', message: 'Database not available' } },
      { status: 503 },
    );
  }

  try {
    const result = await db.prepare(
      'SELECT * FROM link_platforms WHERE lang = ? ORDER BY sort_order',
    ).bind(lang).all<LinkPlatformRow>();

    const data: LinkPlatform[] = result.results.map((r) => ({
      id: r.id, platform: r.platform, url: r.url, icon: r.icon, description: r.description,
    }));

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch link platforms' } },
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
    const body = (await request.json()) as { lang: string; items: LinkPlatform[] };
    const { lang, items } = body;

    if (lang !== 'en' && lang !== 'ko') {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'lang must be "en" or "ko"' } },
        { status: 400 },
      );
    }
    if (!Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'items must be an array' } },
        { status: 400 },
      );
    }

    await db.batch([
      db.prepare('DELETE FROM link_platforms WHERE lang = ?').bind(lang),
      ...items.map((item, idx) =>
        db.prepare(
          'INSERT INTO link_platforms (id, lang, platform, url, icon, description, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ).bind(item.id, lang, item.platform, item.url, item.icon, item.description, idx),
      ),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update link platforms' } },
      { status: 500 },
    );
  }
}
