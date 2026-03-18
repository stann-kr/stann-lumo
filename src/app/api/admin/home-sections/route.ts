/**
 * 어드민 홈 섹션 API
 * GET  /api/admin/home-sections?lang=en|ko
 * PUT  /api/admin/home-sections
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { requireAdminSession } from '@/lib/adminAuth';
import type { HomeSection } from '@/types/content';

interface HomeSectionRow {
  id: string; lang: string; title: string; description: string; path: string; icon: string; sort_order: number;
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
      'SELECT * FROM home_sections WHERE lang = ? ORDER BY sort_order',
    ).bind(lang).all<HomeSectionRow>();

    const data: HomeSection[] = result.results.map((r) => ({
      title: r.title, description: r.description, path: r.path, icon: r.icon,
    }));

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch home sections' } },
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
    const body = (await request.json()) as { lang: string; items: (HomeSection & { id?: string })[] };
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
      db.prepare('DELETE FROM home_sections WHERE lang = ?').bind(lang),
      ...items.map((item, idx) =>
        db.prepare(
          'INSERT INTO home_sections (id, lang, title, description, path, icon, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
        ).bind(item.id ?? String(idx + 1), lang, item.title, item.description, item.path, item.icon, idx),
      ),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update home sections' } },
      { status: 500 },
    );
  }
}
