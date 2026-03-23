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
  poster_image_id: string | null; status: string; sort_order: number;
  ra_venue_id: string | null; ra_country_name: string | null; ra_area_name: string | null;
  ra_area_id: string | null; ra_address: string | null; ra_cost: string | null;
  ra_promoter: string | null; ra_venue_link: string | null; ra_has_tickets: string | null;
  ra_has_barcode: string | null; ra_promoter_id: string | null; ra_lineup_raw: string | null;
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
      ...(r.ra_event_id     != null && { raEventId:     r.ra_event_id }),
      ...(r.poster_image_id != null && { posterImageId: r.poster_image_id }),
      status: r.status as Performance['status'],
      ...(r.ra_venue_id != null && { raVenueId: r.ra_venue_id }),
      ...(r.ra_country_name != null && { raCountryName: r.ra_country_name }),
      ...(r.ra_area_name != null && { raAreaName: r.ra_area_name }),
      ...(r.ra_area_id != null && { raAreaId: r.ra_area_id }),
      ...(r.ra_address != null && { raAddress: r.ra_address }),
      ...(r.ra_cost != null && { raCost: r.ra_cost }),
      ...(r.ra_promoter != null && { raPromoter: r.ra_promoter }),
      ...(r.ra_venue_link != null && { raVenueLink: r.ra_venue_link }),
      raHasTickets: r.ra_has_tickets === '1',
      raHasBarcode: r.ra_has_barcode === '1',
      ...(r.ra_promoter_id != null && { raPromoterId: r.ra_promoter_id }),
      ...(r.ra_lineup_raw != null && { raLineupRaw: r.ra_lineup_raw }),
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
           (id, date, venue, location, time, title, lineup, ra_event_link, ra_event_id, poster_image_id, status, sort_order, ra_venue_id, ra_country_name, ra_area_name, ra_area_id, ra_address, ra_cost, ra_promoter, ra_venue_link, ra_has_tickets, ra_has_barcode, ra_promoter_id, ra_lineup_raw)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          perf.posterImageId ?? null,
          perf.status,
          idx,
          perf.raVenueId ?? null,
          perf.raCountryName ?? null,
          perf.raAreaName ?? null,
          perf.raAreaId ?? null,
          perf.raAddress ?? null,
          perf.raCost ?? null,
          perf.raPromoter ?? null,
          perf.raVenueLink ?? null,
          perf.raHasTickets ? '1' : '0',
          perf.raHasBarcode ? '1' : '0',
          perf.raPromoterId ?? null,
          perf.raLineupRaw ?? null,
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
