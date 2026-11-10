import 'server-only';

import { fetchGalleryPhotoById } from '@/capabilities/media/mediaRepository.server';
import type { D1Database } from '@/lib/db';
import type { EventDetailData, Performance } from './events';

interface PerformanceRow {
  id: string;
  date: string;
  venue: string;
  location: string | null;
  time: string | null;
  title: string;
  lineup: string | null;
  ra_event_link: string | null;
  ra_event_id: string | null;
  poster_image_id: string | null;
  status: string;
  sort_order: number;
  ra_venue_id: string | null;
  ra_country_name: string | null;
  ra_area_name: string | null;
  ra_area_id: string | null;
  ra_address: string | null;
  ra_cost: string | null;
  ra_promoter: string | null;
  ra_venue_link: string | null;
  ra_has_tickets: string | null;
  ra_has_barcode: string | null;
  ra_promoter_id: string | null;
  ra_lineup_raw: string | null;
}

interface PerformancesRevisionRow {
  performances_revision: number;
}

export interface PerformancesSnapshot {
  items: Performance[];
  revision: number;
}

export type ReplacePerformancesResult =
  | { kind: 'success'; snapshot: PerformancesSnapshot }
  | { kind: 'conflict' };

function mapPerformance(row: PerformanceRow): Performance {
  return {
    id: row.id,
    date: row.date,
    venue: row.venue,
    ...(row.location != null && { location: row.location }),
    ...(row.time != null && { time: row.time }),
    title: row.title,
    ...(row.lineup != null && { lineup: row.lineup }),
    ...(row.ra_event_link != null && { raEventLink: row.ra_event_link }),
    ...(row.ra_event_id != null && { raEventId: row.ra_event_id }),
    ...(row.poster_image_id != null && { posterImageId: row.poster_image_id }),
    status: row.status as Performance['status'],
    ...(row.ra_venue_id != null && { raVenueId: row.ra_venue_id }),
    ...(row.ra_country_name != null && { raCountryName: row.ra_country_name }),
    ...(row.ra_area_name != null && { raAreaName: row.ra_area_name }),
    ...(row.ra_area_id != null && { raAreaId: row.ra_area_id }),
    ...(row.ra_address != null && { raAddress: row.ra_address }),
    ...(row.ra_cost != null && { raCost: row.ra_cost }),
    ...(row.ra_promoter != null && { raPromoter: row.ra_promoter }),
    ...(row.ra_venue_link != null && { raVenueLink: row.ra_venue_link }),
    raHasTickets: row.ra_has_tickets === '1',
    raHasBarcode: row.ra_has_barcode === '1',
    ...(row.ra_promoter_id != null && { raPromoterId: row.ra_promoter_id }),
    ...(row.ra_lineup_raw != null && { raLineupRaw: row.ra_lineup_raw }),
  };
}

function mapPublicPerformance(row: PerformanceRow): Performance {
  return {
    id: row.id,
    date: row.date,
    venue: row.venue,
    title: row.title,
    status: row.status as Performance['status'],
    ...(row.location != null && { location: row.location }),
    ...(row.time != null && { time: row.time }),
    ...(row.lineup != null && { lineup: row.lineup }),
    ...(row.ra_event_link != null && { raEventLink: row.ra_event_link }),
    ...(row.ra_event_id != null && { raEventId: row.ra_event_id }),
    ...(row.poster_image_id != null && { posterImageId: row.poster_image_id }),
  };
}

export async function fetchPerformances(db: D1Database): Promise<Performance[]> {
  const result = await db.prepare(
    'SELECT * FROM performances ORDER BY date DESC, sort_order',
  ).all<PerformanceRow>();
  return result.results.map(mapPerformance);
}

export async function fetchPerformancesSnapshot(db: D1Database): Promise<PerformancesSnapshot> {
  const [performancesResult, revisionResult] = await db.batch([
    db.prepare('SELECT * FROM performances ORDER BY date DESC, sort_order'),
    db.prepare('SELECT performances_revision FROM ra_sync_state WHERE id = 1'),
  ]);
  const revision = (revisionResult?.results[0] as PerformancesRevisionRow | undefined)
    ?.performances_revision;

  if (typeof revision !== 'number' || !Number.isSafeInteger(revision) || revision < 0) {
    throw new Error('Performance revision is unavailable');
  }

  return {
    items: (performancesResult?.results as PerformanceRow[]).map(mapPerformance),
    revision,
  };
}

function insertPerformanceStatement(
  db: D1Database,
  performance: Performance,
  sortOrder: number,
  editToken: string,
) {
  return db.prepare(
    `INSERT INTO performances
     (id, date, venue, location, time, title, lineup, ra_event_link, ra_event_id, poster_image_id, status, sort_order, ra_venue_id, ra_country_name, ra_area_name, ra_area_id, ra_address, ra_cost, ra_promoter, ra_venue_link, ra_has_tickets, ra_has_barcode, ra_promoter_id, ra_lineup_raw)
     SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
     WHERE EXISTS (
       SELECT 1 FROM ra_sync_state WHERE id = 1 AND edit_token = ?
     )`,
  ).bind(
    performance.id,
    performance.date,
    performance.venue,
    performance.location ?? null,
    performance.time ?? null,
    performance.title,
    performance.lineup ?? null,
    performance.raEventLink ?? null,
    performance.raEventId ?? null,
    performance.posterImageId ?? null,
    performance.status,
    sortOrder,
    performance.raVenueId ?? null,
    performance.raCountryName ?? null,
    performance.raAreaName ?? null,
    performance.raAreaId ?? null,
    performance.raAddress ?? null,
    performance.raCost ?? null,
    performance.raPromoter ?? null,
    performance.raVenueLink ?? null,
    performance.raHasTickets ? '1' : '0',
    performance.raHasBarcode ? '1' : '0',
    performance.raPromoterId ?? null,
    performance.raLineupRaw ?? null,
    editToken,
  );
}

/**
 * Replaces the admin list only when it was edited from the current database revision.
 * The claim and all writes share one D1 batch, so a scheduled insert cannot be lost
 * between the revision check and the replacement.
 */
export async function replacePerformancesAtRevision(
  db: D1Database,
  items: Performance[],
  expectedRevision: number,
): Promise<ReplacePerformancesResult> {
  const editToken = crypto.randomUUID();
  const retainedRaEventIds = JSON.stringify(
    [...new Set(items.flatMap((performance) => performance.raEventId ? [performance.raEventId] : []))],
  );
  const statements = [
    db.prepare(
      `UPDATE ra_sync_state
       SET edit_token = ?
       WHERE id = 1 AND performances_revision = ? AND edit_token IS NULL`,
    ).bind(editToken, expectedRevision),
    db.prepare(
      `INSERT OR IGNORE INTO ra_event_exclusions (ra_event_id, title, excluded_at)
       SELECT performance.ra_event_id, performance.title, ?
       FROM performances AS performance
       WHERE performance.ra_event_id IS NOT NULL
         AND NOT EXISTS (
           SELECT 1 FROM json_each(?) AS retained
           WHERE retained.value = performance.ra_event_id
         )
         AND EXISTS (
           SELECT 1 FROM ra_sync_state WHERE id = 1 AND edit_token = ?
         )`,
    ).bind(Date.now(), retainedRaEventIds, editToken),
    db.prepare(
      `DELETE FROM performances
       WHERE EXISTS (
         SELECT 1 FROM ra_sync_state WHERE id = 1 AND edit_token = ?
       )`,
    ).bind(editToken),
    ...items.map((performance, index) => insertPerformanceStatement(
      db,
      performance,
      index,
      editToken,
    )),
    db.prepare('SELECT * FROM performances ORDER BY date DESC, sort_order'),
    db.prepare('SELECT performances_revision FROM ra_sync_state WHERE id = 1'),
    db.prepare(
      'UPDATE ra_sync_state SET edit_token = NULL WHERE id = 1 AND edit_token = ?',
    ).bind(editToken),
  ];
  const results = await db.batch(statements);
  const claimed = Number(results[0]?.meta.changes ?? 0) > 0;

  if (!claimed) return { kind: 'conflict' };

  const performancesResult = results[items.length + 3];
  const revisionResult = results[items.length + 4];
  const revision = (revisionResult?.results[0] as PerformancesRevisionRow | undefined)
    ?.performances_revision;
  if (typeof revision !== 'number' || !Number.isSafeInteger(revision) || revision < 0) {
    throw new Error('Performance revision is unavailable');
  }

  return {
    kind: 'success',
    snapshot: {
      items: (performancesResult?.results as PerformanceRow[]).map(mapPerformance),
      revision,
    },
  };
}

export async function fetchEventDetail(db: D1Database, id: string): Promise<EventDetailData | null> {
  const row = await db.prepare(
    'SELECT * FROM performances WHERE id = ?',
  ).bind(id).first<PerformanceRow>();
  if (!row) return null;

  const posterPhoto = row.poster_image_id
    ? await fetchGalleryPhotoById(db, row.poster_image_id)
    : null;
  return {
    event: mapPublicPerformance(row),
    ...(posterPhoto && { posterPhoto }),
  };
}
