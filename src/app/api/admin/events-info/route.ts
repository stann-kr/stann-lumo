/**
 * 어드민 이벤트 정보 API
 * GET  /api/admin/events-info?lang=en|ko
 * PUT  /api/admin/events-info
 */

import { NextRequest, NextResponse } from 'next/server';
import { getDB } from '@/lib/db';
import { requireAdminSession } from '@/lib/adminAuth';
import type { EventsInfo } from '@/types/content';

interface EventsInfoRow {
  id: number; contact_email: string; response_time: string;
}
interface EventsListRow {
  id: string; lang: string; value: string; sort_order: number;
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
    const [infoRes, durationsRes, techRes] = await db.batch([
      db.prepare('SELECT * FROM events_info WHERE id = 1'),
      db.prepare('SELECT * FROM events_set_durations WHERE lang = ? ORDER BY sort_order').bind(lang),
      db.prepare('SELECT * FROM events_tech_requirements WHERE lang = ? ORDER BY sort_order').bind(lang),
    ]);

    const infoRow = infoRes.results[0] as EventsInfoRow | undefined;
    const data: EventsInfo = {
      setDurations:          (durationsRes.results as EventsListRow[]).map((r) => r.value),
      technicalRequirements: (techRes.results      as EventsListRow[]).map((r) => r.value),
      contactEmail:          infoRow?.contact_email ?? '',
      responseTime:          infoRow?.response_time ?? '',
    };

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch events info' } },
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
    const body = (await request.json()) as { lang: string; eventsInfo: EventsInfo };
    const { lang, eventsInfo } = body;

    if (lang !== 'en' && lang !== 'ko') {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'lang must be "en" or "ko"' } },
        { status: 400 },
      );
    }
    if (!eventsInfo || typeof eventsInfo !== 'object') {
      return NextResponse.json(
        { success: false, error: { code: 'BAD_REQUEST', message: 'eventsInfo is required' } },
        { status: 400 },
      );
    }

    const insertDurations = (eventsInfo.setDurations ?? []).map((val, idx) =>
      db.prepare(
        'INSERT INTO events_set_durations (id, lang, value, sort_order) VALUES (?, ?, ?, ?)',
      ).bind(`dur-${lang}-${idx}`, lang, val, idx),
    );
    const insertTech = (eventsInfo.technicalRequirements ?? []).map((val, idx) =>
      db.prepare(
        'INSERT INTO events_tech_requirements (id, lang, value, sort_order) VALUES (?, ?, ?, ?)',
      ).bind(`tech-${lang}-${idx}`, lang, val, idx),
    );

    await db.batch([
      db.prepare(
        'UPDATE events_info SET contact_email = ?, response_time = ? WHERE id = 1',
      ).bind(eventsInfo.contactEmail, eventsInfo.responseTime),
      db.prepare('DELETE FROM events_set_durations WHERE lang = ?').bind(lang),
      db.prepare('DELETE FROM events_tech_requirements WHERE lang = ?').bind(lang),
      ...insertDurations,
      ...insertTech,
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update events info' } },
      { status: 500 },
    );
  }
}
