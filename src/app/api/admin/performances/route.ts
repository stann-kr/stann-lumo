/**
 * 어드민 공연 일정 API
 * GET  /api/admin/performances  — 전체 조회 (lang 무관)
 * PUT  /api/admin/performances  — 전체 교체
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { requireAdminSession } from '@/lib/adminAuth';
import type { Performance } from '@/types/content';

interface PerformanceRow {
  id: string; date: string; venue: string; location: string | null; time: string | null;
  title: string; lineup: string | null; ra_event_link: string | null; ra_event_id: string | null;
  status: string; sort_order: number;
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
      'SELECT * FROM performances ORDER BY date DESC, sort_order',
    ).all<PerformanceRow>();

    const data: Performance[] = result.results.map((r) => ({
      id: r.id, date: r.date, venue: r.venue,
      ...(r.location      != null && { location:    r.location }),
      ...(r.time          != null && { time:        r.time }),
      title: r.title,
      ...(r.lineup        != null && { lineup:      r.lineup }),
      ...(r.ra_event_link != null && { raEventLink: r.ra_event_link }),
      ...(r.ra_event_id   != null && { raEventId:   r.ra_event_id }),
      status: r.status as Performance['status'],
    }));

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch performances' } },
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
    const body = (await request.json()) as { items: Performance[] };
    const { items } = body;

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'items must be an array' } },
        { status: 400 },
      );
    }

    await db.batch([
      db.prepare('DELETE FROM performances'),
      ...items.map((perf, idx) =>
        db.prepare(
          `INSERT INTO performances
           (id, date, venue, location, time, title, lineup, ra_event_link, ra_event_id, status, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        ).bind(
          perf.id,
          perf.date,
          perf.venue,
          perf.location ?? null,
          perf.time ?? null,
          perf.title,
          perf.lineup ?? null,
          perf.raEventLink ?? null,
          perf.raEventId ?? null,
          perf.status,
          idx,
        ),
      ),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update performances' } },
      { status: 500 },
    );
  }
}
