import { decodeHTML } from 'entities';
import { SaxesParser } from 'saxes';
import type { D1Database, D1Result } from '@/lib/db';
import type { Performance } from './events';
import { getRaApiConfigSecret } from './raApiConfigSource';
import type { RAEventXML } from './raApi.types';
import { fetchRaEventsXmlFromSource } from './raEventsSource';
import { RA_SYNC_ANCHOR, RA_SYNC_INTERVAL_MS } from './raSync';
import { readRaSyncState } from './raSyncState';

const FIELD_BY_XML_NAME: Readonly<Record<string, keyof RAEventXML>> = {
  id: 'id',
  venueid: 'venueid',
  title: 'title',
  eventdate: 'eventdate',
  countryname: 'countryname',
  areaname: 'areaname',
  areaid: 'areaId',
  venue: 'venue',
  address: 'address',
  lineup: 'lineup',
  time: 'time',
  cost: 'cost',
  promoter: 'promoter',
  eventlink: 'eventlink',
  venuelink: 'venuelink',
  hastickets: 'hastickets',
  hasbarcode: 'hasbarcode',
  promoterid: 'promoterId',
};

function emptyRaEvent(): RAEventXML {
  return {
    id: '',
    venueid: '',
    title: '',
    eventdate: '',
    countryname: '',
    areaname: '',
    areaId: '',
    venue: '',
    address: '',
    lineup: '',
    time: '',
    cost: '',
    promoter: '',
    eventlink: '',
    venuelink: '',
    hastickets: '',
    hasbarcode: '',
    promoterId: '',
  };
}

export function parseRaEventsXml(xml: string): RAEventXML[] {
  const events: RAEventXML[] = [];
  let currentEvent: RAEventXML | null = null;
  let currentField: keyof RAEventXML | null = null;
  const parser = new SaxesParser({ xmlns: true });
  let rootName = '';
  let hasError = false;

  const appendText = (text: string) => {
    if (currentEvent && currentField) {
      currentEvent[currentField] = `${currentEvent[currentField] ?? ''}${text}`;
    }
  };

  parser.on('opentag', (tag) => {
    const name = tag.local.toLowerCase();
    if (!rootName) rootName = name;
    if (name === 'error' || name === 'fault' || name === 'exception') hasError = true;
    if (name === 'event') {
      currentEvent = emptyRaEvent();
      currentField = null;
      return;
    }
    if (!currentEvent || currentField) return;
    currentField = Object.hasOwn(FIELD_BY_XML_NAME, name) ? FIELD_BY_XML_NAME[name]! : null;
  });
  parser.on('text', appendText);
  parser.on('cdata', appendText);
  parser.on('closetag', (tag) => {
    const name = tag.local.toLowerCase();
    if (name === 'event') {
      if (currentEvent) {
        for (const field of Object.values(FIELD_BY_XML_NAME)) {
          const value = currentEvent[field];
          if (typeof value === 'string') currentEvent[field] = value.trim();
        }
        if (currentEvent.id) events.push(currentEvent);
      }
      currentEvent = null;
      currentField = null;
      return;
    }
    if (currentField === FIELD_BY_XML_NAME[name]) currentField = null;
  });

  try {
    parser.write(xml).close();
  } catch {
    throw new Error('Invalid RA events XML');
  }
  if (hasError || (events.length === 0 && rootName !== 'events')) throw new Error('Invalid RA events XML');
  return events;
}

function formatRaDate(value: string): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match?.[0] ?? '';
}

function cleanRaLineup(value: string): string {
  return decodeHTML(value)
    .replace(/<artist[^>]*>([^<]+)<\/artist>/gi, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();
}

function convertRaEvent(event: RAEventXML): Performance {
  const time = event.time.match(/\d{2}:\d{2}/)?.[0];
  return {
    id: `ra-${event.id}`,
    date: formatRaDate(event.eventdate),
    venue: event.venue || 'TBA',
    title: event.title || event.venue || 'TBA',
    ...(event.areaname || event.countryname
      ? { location: event.areaname || event.countryname }
      : {}),
    ...(time ? { time } : {}),
    ...(event.lineup ? { lineup: cleanRaLineup(event.lineup) } : {}),
    ...(event.eventlink ? { raEventLink: event.eventlink } : {}),
    raEventId: event.id,
    status: 'Announced',
    ...(event.venueid ? { raVenueId: event.venueid } : {}),
    ...(event.countryname ? { raCountryName: event.countryname } : {}),
    ...(event.areaname ? { raAreaName: event.areaname } : {}),
    ...(event.areaId ? { raAreaId: event.areaId } : {}),
    ...(event.address ? { raAddress: event.address } : {}),
    ...(event.cost ? { raCost: event.cost } : {}),
    ...(event.promoter ? { raPromoter: event.promoter } : {}),
    ...(event.venuelink ? { raVenueLink: event.venuelink } : {}),
    raHasTickets: event.hastickets === '1',
    raHasBarcode: event.hasbarcode === '1',
    ...(event.promoterId ? { raPromoterId: event.promoterId } : {}),
    ...(event.lineup ? { raLineupRaw: event.lineup } : {}),
  };
}

function insertRaPerformance(db: D1Database, performance: Performance, sortOrder: number, lease: string) {
  return db.prepare(
    `INSERT OR IGNORE INTO performances
      (id, date, venue, location, time, title, lineup, ra_event_link, ra_event_id,
       poster_image_id, status, sort_order, ra_venue_id, ra_country_name, ra_area_name,
       ra_area_id, ra_address, ra_cost, ra_promoter, ra_venue_link, ra_has_tickets,
       ra_has_barcode, ra_promoter_id, ra_lineup_raw)
     SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
     WHERE EXISTS (SELECT 1 FROM ra_sync_state WHERE id = 1 AND lease_token = ?)
       AND NOT EXISTS (SELECT 1 FROM ra_event_exclusions WHERE ra_event_id = ?)
       AND NOT EXISTS (SELECT 1 FROM performances WHERE ra_event_id = ?)
     RETURNING id`,
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
    lease,
    performance.raEventId,
    performance.raEventId,
  );
}

function countInsertedRows(results: D1Result[]): number {
  return results.reduce((total, result) => {
    if (!result.success) throw new Error('RA event insert failed');
    return total + result.results.length;
  }, 0);
}

export type RaScheduledSyncResult =
  | { kind: 'not-configured' | 'not-due' | 'busy' }
  | { kind: 'failed'; errorCode: string }
  | { kind: 'success'; fetched: number; inserted: number; skippedExcluded: number };

export async function syncRaEvents(
  db: D1Database,
  { mode = 'manual', now = Date.now() }: { mode?: 'manual' | 'scheduled'; now?: number } = {},
): Promise<RaScheduledSyncResult> {
  const startedClock = Date.now();
  const state = await readRaSyncState(db);
  const slot = RA_SYNC_ANCHOR + Math.floor((now - RA_SYNC_ANCHOR) / RA_SYNC_INTERVAL_MS) * RA_SYNC_INTERVAL_MS;
  const newSlot = slot >= RA_SYNC_ANCHOR && (state.scheduled_slot === null || state.scheduled_slot < slot);
  const retryDue = state.next_retry_at !== null && state.next_retry_at <= now && state.retry_attempts < 3;
  if (mode === 'scheduled' && !newSlot && !retryDue) return { kind: 'not-due' };
  if ((state.lease_expires_at ?? 0) > now ||
      (mode === 'manual' && state.last_started_at !== null && now - state.last_started_at < 60_000)) {
    return { kind: 'busy' };
  }

  const lease = crypto.randomUUID();
  const attempts = mode === 'scheduled' ? (newSlot ? 1 : state.retry_attempts + 1) : state.retry_attempts;
  // Pre-arm a retry before I/O so an interrupted Worker can recover after its lease expires.
  const retryAt = mode === 'scheduled' ? (attempts < 3 ? now + 86_400_000 : null) : state.next_retry_at;
  const claim = await db.prepare(`UPDATE ra_sync_state SET lease_token = ?, lease_expires_at = ?,
    last_status = 'running', last_started_at = ?, last_completed_at = NULL, last_error_code = NULL,
    scheduled_slot = ?, retry_attempts = ?, next_retry_at = ?
    WHERE id = 1 AND COALESCE(last_started_at, -1) = ? AND COALESCE(lease_expires_at, 0) <= ?`)
    .bind(lease, now + 300_000, now, mode === 'scheduled' ? slot : state.scheduled_slot,
      attempts, retryAt, state.last_started_at ?? -1, now).run();
  if (claim.meta.changes !== 1) return { kind: 'busy' };

  let errorCode = 'DATABASE_ERROR';
  let result: RaScheduledSyncResult;
  try {
    const config = await getRaApiConfigSecret(db);
    if (!config) {
      errorCode = 'NOT_CONFIGURED';
      result = { kind: 'not-configured' };
    } else {
      const upstream = await fetchRaEventsXmlFromSource(config, null, null);
      if (upstream.kind !== 'success') {
        errorCode = upstream.kind === 'upstream-error' ? 'UPSTREAM_HTTP'
          : upstream.kind === 'unsafe-response' ? 'UNSAFE_RESPONSE' : 'TRANSPORT_ERROR';
        throw new Error(errorCode);
      }
      errorCode = 'INVALID_RESPONSE';
      const uniquePerformances = new Map<string, Performance>();
      for (const event of parseRaEventsXml(upstream.xml)) {
        if (!/^\d+$/.test(event.id) || !formatRaDate(event.eventdate)) throw new Error(errorCode);
        if (!uniquePerformances.has(event.id)) uniquePerformances.set(event.id, convertRaEvent(event));
      }
      const performances = [...uniquePerformances.values()];
      errorCode = 'DATABASE_ERROR';
      const excluded = await db.prepare(`SELECT ra_event_id FROM ra_event_exclusions
        WHERE ra_event_id IN (SELECT value FROM json_each(?))`)
        .bind(JSON.stringify([...uniquePerformances.keys()])).all<{ ra_event_id: string }>();
      const results = performances.length ? await db.batch(
        performances.map((performance, index) => insertRaPerformance(db, performance, index, lease)),
      ) : [];
      result = { kind: 'success', fetched: performances.length, inserted: countInsertedRows(results),
        skippedExcluded: excluded.results.length };
    }
  } catch {
    result = { kind: 'failed', errorCode };
  }

  const completedAt = now + Math.max(0, Date.now() - startedClock);
  const successfulResult = result.kind === 'success' ? result : null;
  const success = successfulResult !== null;
  const finish = await db.prepare(`UPDATE ra_sync_state SET last_status = ?, last_completed_at = ?,
    last_success_at = CASE WHEN ? THEN ? ELSE last_success_at END, last_error_code = ?,
    last_fetched = ?, last_inserted = ?, last_skipped_excluded = ?,
    next_retry_at = CASE WHEN ? THEN NULL ELSE next_retry_at END,
    lease_token = NULL, lease_expires_at = NULL WHERE id = 1 AND lease_token = ?`)
    .bind(success ? 'success' : result.kind === 'not-configured' ? 'not-configured' : 'failed',
      completedAt, success ? 1 : 0, completedAt, success ? null : errorCode,
      successfulResult?.fetched ?? 0, successfulResult?.inserted ?? 0, successfulResult?.skippedExcluded ?? 0,
      success ? 1 : 0, lease).run();
  return finish.meta.changes === 1 ? result : { kind: 'busy' };
}
