/**
 * 어드민 트랙 API
 * GET  /api/admin/tracks?lang=en|ko
 * PUT  /api/admin/tracks
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { requireAdminSession } from '@/lib/adminAuth';
import type { Track } from '@/types/content';

interface TrackRow {
  id: string; lang: string; title: string; type: string; duration: string;
  year: string; platform: string; link: string; sort_order: number;
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
      'SELECT * FROM tracks WHERE lang = ? ORDER BY sort_order',
    ).bind(lang).all<TrackRow>();

    const data: Track[] = result.results.map((r) => ({
      id: r.id, title: r.title, type: r.type, duration: r.duration,
      year: r.year, platform: r.platform, link: r.link,
    }));

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch tracks' } },
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
    const body = (await request.json()) as { lang: string; items: Track[] };
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
      db.prepare('DELETE FROM tracks WHERE lang = ?').bind(lang),
      ...items.map((track, idx) =>
        db.prepare(
          'INSERT INTO tracks (id, lang, title, type, duration, year, platform, link, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        ).bind(track.id, lang, track.title, track.type, track.duration, track.year, track.platform, track.link, idx),
      ),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update tracks' } },
      { status: 500 },
    );
  }
}
