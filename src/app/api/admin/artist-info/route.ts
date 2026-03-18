/**
 * 어드민 아티스트 정보 API
 * GET  /api/admin/artist-info?lang=en|ko  — 목록 조회
 * PUT  /api/admin/artist-info             — 전체 교체 (lang별)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { requireAdminSession } from '@/lib/adminAuth';
import type { ArtistInfoItem } from '@/types/content';

interface ArtistInfoRow {
  id: string; lang: string; key: string; value: string; sort_order: number;
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
      'SELECT * FROM artist_info WHERE lang = ? ORDER BY sort_order',
    ).bind(lang).all<ArtistInfoRow>();

    const data: ArtistInfoItem[] = result.results.map((r) => ({
      id: r.id, key: r.key, value: r.value,
    }));

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch artist info' } },
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
    const body = (await request.json()) as { lang: string; items: ArtistInfoItem[] };
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
      db.prepare('DELETE FROM artist_info WHERE lang = ?').bind(lang),
      ...items.map((item, idx) =>
        db.prepare(
          'INSERT INTO artist_info (id, lang, key, value, sort_order) VALUES (?, ?, ?, ?, ?)',
        ).bind(item.id, lang, item.key, item.value, idx),
      ),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update artist info' } },
      { status: 500 },
    );
  }
}
